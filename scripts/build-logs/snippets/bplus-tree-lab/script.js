const VISUAL_LEAF_MAX_KEYS = 3;
const VISUAL_INTERNAL_MAX_KEYS = 3;
const MIN_LEAF_KEYS = 2;
const MIN_CHILDREN = 2;

const viewport = document.getElementById("tree-viewport");
const stage = document.getElementById("tree-stage");
const edgeSvg = document.getElementById("edges");
const commandInput = document.getElementById("command");
const liveRegion = document.getElementById("live-region");
const nodeEls = new Map();
const edgeEls = new Map();
const leafLinkEls = new Map();
let pendingEl = null;

let nextPage = 1;
let root;
let frames = [];
let frameIndex = 0;
let playTimer = null;

const code = {
  open: {
    label: "db_open()",
    lines: [
      "void *root = get_page(pager, 0);",
      "initialize_leaf_node(root);",
      "set_node_root(root, true);",
    ],
    hot: 0,
  },
  prepare: {
    label: "prepare_statement()",
    lines: [
      'if (strncmp(input_buffer->buffer, "insert", 6) == 0) {',
      "  return prepare_insert(input_buffer, statement);",
      "}",
    ],
    hot: 1,
  },
  execute: {
    label: "execute_statement()",
    kind: "ABRIDGED SOURCE",
    lines: [
      "switch (statement->type) {",
      "  case STATEMENT_INSERT: return execute_insert(...);",
      "  case STATEMENT_SELECT: return execute_select(...);",
      "}",
    ],
    hot: 1,
  },
  internalFind: {
    label: "internal_node_find_child()",
    lines: [
      "uint32_t index = (min_index + max_index) / 2;",
      "uint32_t key_to_right = *internal_node_key(node, index);",
      "if (key_to_right >= key) max_index = index;",
    ],
    hot: 0,
  },
  leafFind: {
    label: "leaf_node_find()",
    lines: [
      "uint32_t index = (min_index + one_past_max_index) / 2;",
      "uint32_t key_at_index = *leaf_node_key(node, index);",
      "if (key == key_at_index) return cursor;",
    ],
    hot: 1,
  },
  insert: {
    label: "leaf_node_insert()",
    lines: [
      "memcpy(leaf_node_cell(node, i),",
      "       leaf_node_cell(node, i - 1), LEAF_NODE_CELL_SIZE);",
      "*leaf_node_key(node, cursor->cell_num) = key;",
    ],
    hot: 2,
  },
  split: {
    label: "leaf_node_split_and_insert()",
    lines: [
      "*leaf_node_next_leaf(new_node) = *leaf_node_next_leaf(old_node);",
      "*leaf_node_next_leaf(old_node) = new_page_num;",
      "destination_node = i >= LEAF_NODE_LEFT_SPLIT_COUNT ? new_node : old_node;",
    ],
    hot: 1,
  },
  root: {
    label: "create_new_root()",
    lines: [
      "memcpy(left_child, root, PAGE_SIZE);",
      "initialize_internal_node(root);",
      "*internal_node_child(root, 0) = left_child_page_num;",
    ],
    hot: 1,
  },
  parent: {
    label: "internal_node_insert()",
    lines: [
      "if (original_num_keys >= INTERNAL_NODE_MAX_CELLS) {",
      "  internal_node_split_and_insert(table, parent_page_num, child_page_num);",
      "  return;",
    ],
    hot: 1,
  },
  select: {
    label: "cursor_advance()",
    kind: "ABRIDGED SOURCE",
    lines: [
      "cursor->cell_num += 1;",
      "uint32_t next_page_num = *leaf_node_next_leaf(node);",
      "if (next_page_num == 0) cursor->end_of_table = true;",
      "else { cursor->page_num = next_page_num; cursor->cell_num = 0; }",
    ],
    hot: 1,
  },
  remove: {
    label: "conceptual delete",
    kind: "TEACHING PSEUDOCODE",
    lines: [
      "remove key from its leaf;",
      "borrow from a sibling or merge leaves;",
      "repair parent separators and root height;",
    ],
    hot: 1,
  },
  print: {
    label: "print_tree()",
    kind: "TEACHING PSEUDOCODE",
    lines: [
      "switch (get_node_type(node)) {",
      "  print keys or recurse through child pages;",
      "}",
    ],
    hot: 1,
  },
};

function leaf(id = nextPage++) {
  return { id, leaf: true, keys: [], rows: [], children: [], next: 0 };
}

function internal(id = nextPage++, children = []) {
  return { id, leaf: false, keys: [], rows: [], children, next: 0 };
}

function resetModel() {
  nextPage = 1;
  root = leaf(0);
  frames = [];
  capture(
    "An empty database file",
    "Opening a new file turns page 0 into an empty leaf. It is also the root.",
    { phase: "DB OPEN", pipeline: ["pager"], code: code.open, activeNodes: [0] },
  );
}

function cloneNode(node) {
  return {
    id: node.id,
    leaf: node.leaf,
    keys: [...node.keys],
    rows: node.rows.map((row) => ({ ...row })),
    children: node.children.map(cloneNode),
    next: node.next,
  };
}

function maxKey(node) {
  if (node.leaf) return node.keys.length ? node.keys[node.keys.length - 1] : Number.NEGATIVE_INFINITY;
  return node.children.length ? maxKey(node.children[node.children.length - 1]) : Number.NEGATIVE_INFINITY;
}

function recompute(node) {
  if (node.leaf) return;
  node.children.forEach(recompute);
  node.keys = node.children.slice(0, -1).map(maxKey);
}

function countPages(node) {
  return 1 + node.children.reduce((sum, child) => sum + countPages(child), 0);
}

function countRows(node) {
  if (node.leaf) return node.keys.length;
  return node.children.reduce((sum, child) => sum + countRows(child), 0);
}

function height(node) {
  return node.leaf ? 1 : 1 + Math.max(...node.children.map(height));
}

function findNode(node, id) {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function findParent(node, childId) {
  if (node.leaf) return null;
  if (node.children.some((child) => child.id === childId)) return node;
  for (const child of node.children) {
    const found = findParent(child, childId);
    if (found) return found;
  }
  return null;
}

function leavesOf(node, out = []) {
  if (node.leaf) out.push(node);
  else node.children.forEach((child) => leavesOf(child, out));
  return out;
}

function capture(title, detail, options = {}) {
  recompute(root);
  frames.push({
    tree: cloneNode(root),
    title,
    detail,
    phase: options.phase || "TRACE",
    pipeline: options.pipeline || ["cursor", "pager"],
    code: options.code || code.leafFind,
    activeNodes: options.activeNodes || [],
    activeKeys: options.activeKeys || [],
    activeCellNodeId: options.activeCellNodeId,
    activeEdges: options.activeEdges || [],
    splitNodes: options.splitNodes || [],
    pageKind: options.pageKind,
    pendingKey: options.pendingKey,
    pendingText: options.pendingText,
    pendingSubtext: options.pendingSubtext,
    pendingNodeId: options.pendingNodeId,
  });
}

function lowerBound(keys, key, onProbe) {
  let minIndex = 0;
  let maxIndex = keys.length;
  while (minIndex !== maxIndex) {
    const index = Math.floor((minIndex + maxIndex) / 2);
    const probe = keys[index];
    onProbe?.({ index, probe, minIndex, maxIndex });
    if (probe >= key) {
      maxIndex = index;
    } else {
      minIndex = index + 1;
    }
  }
  return minIndex;
}

function searchLeaf(key, operation, { includeExecute = true } = {}) {
  let node = root;
  const pathNodes = [root.id];
  const pathEdges = [];
  const activePipeline = includeExecute ? ["execute", "cursor", "pager"] : ["cursor", "pager"];

  while (!node.leaf) {
    const index = lowerBound(node.keys, key, ({ index: probeIndex, probe, minIndex, maxIndex }) => {
      const direction = probe >= key
        ? `${probe} is at least ${key}, so the upper bound moves to cell ${probeIndex}.`
        : `${probe} is below ${key}, so the lower bound moves past cell ${probeIndex}.`;
      capture(`Probe separator ${probe}`, `${direction} The active interval was [${minIndex}, ${maxIndex}).`, {
        phase: `${operation} · BINARY SEARCH`,
        pipeline: activePipeline,
        code: code.internalFind,
        activeNodes: [...pathNodes],
        activeKeys: [probe],
        activeCellNodeId: node.id,
        activeEdges: [...pathEdges],
        pageKind: "internal",
      });
    });

    const child = node.children[index];
    pathEdges.push(`${node.id}-${child.id}`);
    pathNodes.push(child.id);
    const decision = index < node.keys.length
      ? `Cell ${index} routes keys through ${node.keys[index]} to page ${child.id}.`
      : `The key exceeds every separator, so the right-child pointer supplies page ${child.id}.`;
    capture(`Load child page ${child.id}`, decision, {
      phase: operation,
      pipeline: activePipeline,
      code: code.internalFind,
      activeNodes: [...pathNodes],
      activeEdges: [...pathEdges],
      pageKind: child.leaf ? "leaf" : "internal",
    });
    node = child;
  }

  const index = lowerBound(node.keys, key, ({ index: probeIndex, probe, minIndex, maxIndex }) => {
    const relation = probe === key
      ? `${probe} equals the requested key.`
      : probe > key
        ? `${probe} is larger, so the upper bound moves to cell ${probeIndex}.`
        : `${probe} is smaller, so the lower bound moves past cell ${probeIndex}.`;
    capture(`Probe leaf cell ${probeIndex}`, `${relation} The active interval was [${minIndex}, ${maxIndex}).`, {
      phase: `${operation} · BINARY SEARCH`,
      pipeline: activePipeline,
      code: code.leafFind,
      activeNodes: [...pathNodes],
      activeEdges: [...pathEdges],
      activeKeys: [probe],
      activeCellNodeId: node.id,
      pageKind: "leaf",
    });
  });

  const found = index < node.keys.length && node.keys[index] === key;
  capture(`Cursor stops at cell ${index}`, found
    ? `Leaf page ${node.id} contains key ${key} at this position.`
    : `Leaf page ${node.id} has no equal key. Cell ${index} is the insertion position.`, {
    phase: operation,
    pipeline: activePipeline,
    code: code.leafFind,
    activeNodes: [...pathNodes],
    activeEdges: [...pathEdges],
    activeKeys: found ? [key] : [],
    activeCellNodeId: node.id,
    pageKind: "leaf",
  });

  return { node, index, found };
}

function startCommand(title, detail, phase = "REPL") {
  frames = [];
  capture(title, detail, {
    phase,
    pipeline: ["repl", "prepare"],
    code: code.prepare,
    activeNodes: [],
  });
}

function insertKey(key, row = {}, append = false) {
  if (!append) startCommand(`Prepare INSERT ${key}`, "The REPL validates the fixed row shape and stores it in a Statement.");
  else {
    capture(`Prepare INSERT ${key}`, "The next line becomes a fixed INSERT statement.", {
      phase: "REPL",
      pipeline: ["repl", "prepare"],
      code: code.prepare,
    });
  }

  capture(`Dispatch INSERT ${key}`, "`execute_statement()` selects `execute_insert()`, which asks the tree for this key's cursor position.", {
    phase: "EXECUTE",
    pipeline: ["execute"],
    code: code.execute,
  });

  const result = searchLeaf(key, "INSERT");
  const target = result.node;
  if (result.found) {
    capture(`Key ${key} already exists`, "The lab applies the intended check in the destination leaf. The pinned commit's check becomes unreliable after page 0 turns internal.", {
      phase: "DUPLICATE",
      pipeline: ["execute", "cursor"],
      code: code.leafFind,
      activeNodes: [target.id],
      activeKeys: [key],
      activeCellNodeId: target.id,
      pageKind: "leaf",
    });
    return false;
  }

  const serializedRow = {
    id: key,
    username: row.username || `user${key}`,
    email: row.email || `person${key}@example.com`,
  };

  if (target.keys.length >= VISUAL_LEAF_MAX_KEYS) {
    const parent = target === root ? null : findParent(root, target.id);
    const parentFull = parent && parent.children.length >= VISUAL_INTERNAL_MAX_KEYS + 1;
    capture(`Leaf page ${target.id} is full`, parentFull
      ? `Key ${key} remains outside the page. Splitting this leaf also produces a child pointer for a full parent, so both levels will be redistributed.`
      : `Key ${key} remains outside the page while the existing cells and incoming row are redistributed. The source does the same check before writing its fourteenth cell.`, {
      phase: "PENDING SPLIT",
      pipeline: ["execute", "cursor", "pager"],
      code: code.split,
      activeNodes: parentFull ? [parent.id, target.id] : [target.id],
      activeKeys: [...target.keys],
      activeCellNodeId: target.id,
      pendingKey: key,
      pendingNodeId: target.id,
      pendingSubtext: "incoming row",
      pageKind: "leaf",
    });
    splitLeaf(target, key, serializedRow, result.index);
    return true;
  }

  target.keys.splice(result.index, 0, key);
  target.rows.splice(result.index, 0, serializedRow);

  capture(`Write key ${key} into leaf page ${target.id}`, "Cells to the right shift once. The key and serialized 293-byte row occupy one 297-byte leaf cell.", {
    phase: "INSERT",
    pipeline: ["execute", "cursor", "pager"],
    code: code.insert,
    activeNodes: [target.id],
    activeKeys: [key],
    activeCellNodeId: target.id,
    pageKind: "leaf",
  });

  return true;
}

function splitLeaf(node, insertedKey, insertedRow, insertionIndex) {
  const parent = node === root ? null : findParent(root, node.id);
  const combinedKeys = [...node.keys];
  const combinedRows = node.rows.map((row) => ({ ...row }));
  combinedKeys.splice(insertionIndex, 0, insertedKey);
  combinedRows.splice(insertionIndex, 0, insertedRow);
  const splitAt = Math.ceil(combinedKeys.length / 2);
  const leftKeys = combinedKeys.slice(0, splitAt);
  const leftRows = combinedRows.slice(0, splitAt);
  const rightKeys = combinedKeys.slice(splitAt);
  const rightRows = combinedRows.slice(splitAt);

  if (node === root) {
    const rightNode = leaf();
    rightNode.keys = rightKeys;
    rightNode.rows = rightRows;
    const leftNode = leaf();
    leftNode.keys = leftKeys;
    leftNode.rows = leftRows;
    leftNode.next = rightNode.id;

    root.leaf = false;
    root.keys = [];
    root.rows = [];
    root.children = [leftNode, rightNode];
    root.next = 0;

    capture("The first leaf split creates a new root", "Page 0 is reinitialised as an internal page. Two new leaf pages receive the sorted rows.", {
      phase: "ROOT SPLIT",
      pipeline: ["execute", "cursor", "pager"],
      code: code.root,
      activeNodes: [0, leftNode.id, rightNode.id],
      activeKeys: [insertedKey],
      activeCellNodeId: leftNode.keys.includes(insertedKey) ? leftNode.id : rightNode.id,
      splitNodes: [0, leftNode.id, rightNode.id],
      pageKind: "internal",
    });
    return;
  }

  node.keys = leftKeys;
  node.rows = leftRows;
  const rightNode = leaf();
  rightNode.keys = rightKeys;
  rightNode.rows = rightRows;
  rightNode.next = node.next;
  node.next = rightNode.id;

  const index = parent.children.findIndex((child) => child.id === node.id);
  if (parent.children.length < VISUAL_INTERNAL_MAX_KEYS + 1) {
    parent.children.splice(index + 1, 0, rightNode);
    capture(`Split leaf page ${node.id}`, `The lower half stays on page ${node.id}. The upper half moves to page ${rightNode.id}, and the parent receives its child pointer.`, {
      phase: "LEAF SPLIT",
      pipeline: ["execute", "cursor", "pager"],
      code: code.split,
      activeNodes: [parent.id, node.id, rightNode.id],
      activeKeys: [insertedKey],
      activeCellNodeId: node.keys.includes(insertedKey) ? node.id : rightNode.id,
      activeEdges: [`${parent.id}-${node.id}`, `${parent.id}-${rightNode.id}`],
      splitNodes: [node.id, rightNode.id],
      pageKind: "leaf",
    });
    return;
  }

  splitInternal(parent, rightNode, index + 1, insertedKey);
}

function splitInternal(node, incomingChild, insertionIndex, insertedKey) {
  capture(`Internal page ${node.id} is full`, `Page ${incomingChild.id} has been allocated, but its child pointer stays outside the full teaching node until the pointers are redistributed.`, {
    phase: "PENDING PARENT SPLIT",
    pipeline: ["execute", "cursor", "pager"],
    code: code.parent,
    activeNodes: [node.id],
    activeKeys: [...node.keys],
    activeCellNodeId: node.id,
    pendingText: `PAGE ${incomingChild.id}`,
    pendingNodeId: node.id,
    pendingSubtext: "new child pointer",
    pageKind: "internal",
  });

  const combinedChildren = [...node.children];
  combinedChildren.splice(insertionIndex, 0, incomingChild);
  const splitAt = Math.ceil(combinedChildren.length / 2);
  const lower = combinedChildren.slice(0, splitAt);
  const upper = combinedChildren.slice(splitAt);

  if (node === root) {
    const rightNode = internal(nextPage++, upper);
    const leftNode = internal(nextPage++, lower);
    root.leaf = false;
    root.rows = [];
    root.children = [leftNode, rightNode];
    recompute(root);
    capture("The internal root grows another level", "Page 0 remains the root. Five child pointers are redistributed between two new internal pages without writing an over-capacity cell.", {
      phase: "ROOT SPLIT",
      pipeline: ["execute", "cursor", "pager"],
      code: code.root,
      activeNodes: [0, leftNode.id, rightNode.id],
      activeKeys: [insertedKey],
      splitNodes: [0, leftNode.id, rightNode.id],
      pageKind: "internal",
    });
    return;
  }

  const parent = findParent(root, node.id);
  node.children = lower;
  const rightNode = internal(nextPage++, upper);
  const index = parent.children.findIndex((child) => child.id === node.id);
  if (parent.children.length < VISUAL_INTERNAL_MAX_KEYS + 1) {
    parent.children.splice(index + 1, 0, rightNode);
    recompute(root);
    capture(`Split internal page ${node.id}`, `Its higher child pointers move to page ${rightNode.id}, then the parent receives one new pointer.`, {
      phase: "INTERNAL SPLIT",
      pipeline: ["execute", "cursor", "pager"],
      code: code.parent,
      activeNodes: [parent.id, node.id, rightNode.id],
      activeKeys: [insertedKey],
      splitNodes: [node.id, rightNode.id],
      pageKind: "internal",
    });
    return;
  }

  splitInternal(parent, rightNode, index + 1, insertedKey);
}

function findKey(key) {
  frames = [];
  capture(`Visual FIND ${key}`, "FIND is a lab control that exposes the same `table_find()` path used inside INSERT.", {
    phase: "LAB EXTENSION",
    pipeline: ["cursor"],
    code: code.internalFind,
  });
  const result = searchLeaf(key, "FIND*", { includeExecute: false });
  capture(result.found ? `Found row ${key}` : `Key ${key} is absent`, result.found
    ? `The complete row is stored beside key ${key} in leaf page ${result.node.id}.`
    : `The cursor stopped at cell ${result.index} in page ${result.node.id}, where the key would be inserted.`, {
    phase: result.found ? "FOUND*" : "MISS*",
    pipeline: ["cursor", "pager"],
    code: code.leafFind,
    activeNodes: [result.node.id],
    activeKeys: result.found ? [key] : [],
    activeCellNodeId: result.node.id,
    pageKind: "leaf",
  });
}

function scanTree(append = false) {
  if (!append) startCommand("Prepare full SELECT", "The executor asks for a cursor at the start of the table.", "SELECT");
  else {
    capture("Prepare a full SELECT", "The exact `select` statement becomes `STATEMENT_SELECT`.", {
      phase: "PREPARE",
      pipeline: ["repl", "prepare"],
      code: code.prepare,
    });
  }
  capture("Dispatch full SELECT", "`execute_select()` asks for a cursor at the beginning of the table.", {
    phase: "EXECUTE",
    pipeline: ["execute"],
    code: code.execute,
  });

  let node = root;
  const activeEdges = [];
  while (!node.leaf) {
    const child = node.children[0];
    activeEdges.push(`${node.id}-${child.id}`);
    capture(`Take the leftmost child from page ${node.id}`, "The smallest row must be below the first child pointer.", {
      phase: "TABLE START",
      pipeline: ["execute", "cursor", "pager"],
      code: code.internalFind,
      activeNodes: [node.id, child.id],
      activeEdges: [...activeEdges],
      pageKind: child.leaf ? "leaf" : "internal",
    });
    node = child;
  }

  const result = [];
  let current = node;
  let previous = null;
  while (current) {
    const next = current.next === 0 ? null : findNode(root, current.next);
    if (previous) {
      capture(`Follow NEXT ${previous.next}`, `The cursor finished page ${previous.id}, resets its cell number to zero and loads leaf page ${current.id}.`, {
        phase: "NEXT LEAF",
        pipeline: ["execute", "cursor", "pager"],
        code: code.select,
        activeNodes: [previous.id, current.id],
        activeEdges: [`leaf-${previous.id}-${current.id}`],
        pageKind: "leaf",
      });
    }
    if (!current.keys.length) {
      capture(`Leaf page ${current.id} is empty`, "The cursor is already at the end of the table.", {
        phase: "SELECT",
        pipeline: ["execute", "cursor", "pager"],
        code: code.select,
        activeNodes: [current.id],
        pageKind: "leaf",
      });
    }
    current.keys.forEach((key, cellIndex) => {
      result.push(key);
      const lastCell = cellIndex === current.keys.length - 1;
      const detail = lastCell
        ? next
          ? `Cell ${cellIndex} is deserialized, then cursor_advance() reaches the page boundary and reads NEXT ${current.next}.`
          : `Cell ${cellIndex} is deserialized. NEXT is zero, so cursor_advance() sets end_of_table.`
        : `Cell ${cellIndex} is deserialized, then cursor_advance() moves to cell ${cellIndex + 1} on the same page.`;
      capture(`Emit row ${key} from page ${current.id}`, detail, {
        phase: "SELECT",
        pipeline: ["execute", "cursor", "pager"],
        code: code.select,
        activeNodes: [current.id],
        activeKeys: [key],
        activeCellNodeId: current.id,
        pageKind: "leaf",
      });
    });
    previous = current;
    current = next;
  }

  capture("The scan is complete", result.length ? `Result order is ${result.join(", ")}.` : "The table has no rows.", {
    phase: "RESULT",
    pipeline: ["execute", "cursor"],
    code: code.select,
    activeNodes: leavesOf(root).map((item) => item.id),
    activeKeys: result,
    pageKind: "leaf",
  });
}

function deleteKey(key) {
  frames = [];
  capture(`Visual DELETE ${key}`, "This command belongs to the visual lab. The C repository has no DELETE statement.", {
    phase: "LAB EXTENSION",
    pipeline: ["cursor"],
    code: code.remove,
  });
  const result = searchLeaf(key, "DELETE*", { includeExecute: false });
  const target = result.node;
  if (!result.found) {
    capture(`Key ${key} is absent`, "There is no leaf cell to remove.", {
      phase: "MISS",
      pipeline: ["cursor"],
      code: code.remove,
      activeNodes: [target.id],
      pageKind: "leaf",
    });
    return;
  }

  target.keys.splice(result.index, 1);
  target.rows.splice(result.index, 1);
  capture(`Remove key ${key} from page ${target.id}`, "The remaining cells close the gap and the parent separators are recalculated.", {
    phase: "DELETE*",
    pipeline: ["cursor", "pager"],
    code: code.remove,
    activeNodes: [target.id],
    activeKeys: [key],
    pageKind: "leaf",
  });

  if (target === root || target.keys.length >= MIN_LEAF_KEYS) {
    recompute(root);
    capture("The leaf still has enough rows", "No structural repair is needed.", {
      phase: "BALANCED",
      pipeline: ["cursor", "pager"],
      code: code.remove,
      activeNodes: [target.id],
      pageKind: "leaf",
    });
    return;
  }
  rebalanceLeaf(target);
}

function rebalanceLeaf(node) {
  const parent = findParent(root, node.id);
  const index = parent.children.findIndex((child) => child.id === node.id);
  const left = index > 0 ? parent.children[index - 1] : null;
  const right = index + 1 < parent.children.length ? parent.children[index + 1] : null;

  if (left && left.leaf && left.keys.length > MIN_LEAF_KEYS) {
    node.keys.unshift(left.keys.pop());
    node.rows.unshift(left.rows.pop());
    recompute(root);
    capture(`Borrow one row from page ${left.id}`, `The underfilled page ${node.id} takes the largest row from its left sibling.`, {
      phase: "BORROW",
      pipeline: ["cursor", "pager"],
      code: code.remove,
      activeNodes: [parent.id, left.id, node.id],
      splitNodes: [left.id, node.id],
      pageKind: "leaf",
    });
    return;
  }

  if (right && right.leaf && right.keys.length > MIN_LEAF_KEYS) {
    node.keys.push(right.keys.shift());
    node.rows.push(right.rows.shift());
    recompute(root);
    capture(`Borrow one row from page ${right.id}`, `The underfilled page ${node.id} takes the smallest row from its right sibling.`, {
      phase: "BORROW",
      pipeline: ["cursor", "pager"],
      code: code.remove,
      activeNodes: [parent.id, node.id, right.id],
      splitNodes: [node.id, right.id],
      pageKind: "leaf",
    });
    return;
  }

  if (left && left.leaf) {
    left.keys.push(...node.keys);
    left.rows.push(...node.rows);
    left.next = node.next;
    parent.children.splice(index, 1);
    recompute(root);
    capture(`Merge page ${node.id} into page ${left.id}`, "The leaf link closes over the removed page. Its parent loses one child pointer.", {
      phase: "MERGE",
      pipeline: ["cursor", "pager"],
      code: code.remove,
      activeNodes: [parent.id, left.id],
      splitNodes: [left.id],
      pageKind: "leaf",
    });
  } else if (right && right.leaf) {
    node.keys.push(...right.keys);
    node.rows.push(...right.rows);
    node.next = right.next;
    parent.children.splice(index + 1, 1);
    recompute(root);
    capture(`Merge page ${right.id} into page ${node.id}`, "The surviving leaf keeps the sorted rows and points at the following leaf.", {
      phase: "MERGE",
      pipeline: ["cursor", "pager"],
      code: code.remove,
      activeNodes: [parent.id, node.id],
      splitNodes: [node.id],
      pageKind: "leaf",
    });
  }

  rebalanceInternal(parent);
}

function rebalanceInternal(node) {
  if (node === root) {
    if (!root.leaf && root.children.length === 1) {
      const child = root.children[0];
      root.leaf = child.leaf;
      root.keys = [...child.keys];
      root.rows = child.rows.map((row) => ({ ...row }));
      root.children = child.children;
      root.next = child.leaf ? child.next : 0;
      recompute(root);
      capture("The root contracts", "Its only child is copied back into page 0, reducing the tree height by one.", {
        phase: "ROOT MERGE",
        pipeline: ["cursor", "pager"],
        code: code.root,
        activeNodes: [0],
        splitNodes: [0],
        pageKind: root.leaf ? "leaf" : "internal",
      });
    } else {
      capture("Parent separators repaired", "Every separator again equals the maximum key of the child on its left.", {
        phase: "BALANCED",
        pipeline: ["cursor", "pager"],
        code: code.parent,
        activeNodes: [root.id],
        pageKind: "internal",
      });
    }
    return;
  }

  if (node.children.length >= MIN_CHILDREN) {
    recompute(root);
    capture(`Internal page ${node.id} remains valid`, "The merge did not propagate any farther.", {
      phase: "BALANCED",
      pipeline: ["cursor", "pager"],
      code: code.parent,
      activeNodes: [node.id],
      pageKind: "internal",
    });
    return;
  }

  const parent = findParent(root, node.id);
  const index = parent.children.findIndex((child) => child.id === node.id);
  const left = index > 0 ? parent.children[index - 1] : null;
  const right = index + 1 < parent.children.length ? parent.children[index + 1] : null;

  if (left && !left.leaf && left.children.length > MIN_CHILDREN) {
    node.children.unshift(left.children.pop());
    recompute(root);
    capture(`Borrow a child from internal page ${left.id}`, "One subtree crosses the sibling boundary and both separator sets are rebuilt.", {
      phase: "BORROW",
      pipeline: ["cursor", "pager"],
      code: code.remove,
      activeNodes: [parent.id, left.id, node.id],
      splitNodes: [left.id, node.id],
      pageKind: "internal",
    });
    return;
  }

  if (right && !right.leaf && right.children.length > MIN_CHILDREN) {
    node.children.push(right.children.shift());
    recompute(root);
    capture(`Borrow a child from internal page ${right.id}`, "The first subtree on the right moves into the underfilled internal page.", {
      phase: "BORROW",
      pipeline: ["cursor", "pager"],
      code: code.remove,
      activeNodes: [parent.id, node.id, right.id],
      splitNodes: [node.id, right.id],
      pageKind: "internal",
    });
    return;
  }

  if (left && !left.leaf) {
    left.children.push(...node.children);
    parent.children.splice(index, 1);
    recompute(root);
    capture(`Merge internal page ${node.id}`, "Its child pointers move into the left sibling, which can make the parent underfill.", {
      phase: "INTERNAL MERGE",
      pipeline: ["cursor", "pager"],
      code: code.remove,
      activeNodes: [parent.id, left.id],
      splitNodes: [left.id],
      pageKind: "internal",
    });
  } else if (right && !right.leaf) {
    node.children.push(...right.children);
    parent.children.splice(index + 1, 1);
    recompute(root);
    capture(`Merge internal page ${right.id}`, "The surviving page takes its sibling's child pointers.", {
      phase: "INTERNAL MERGE",
      pipeline: ["cursor", "pager"],
      code: code.remove,
      activeNodes: [parent.id, node.id],
      splitNodes: [node.id],
      pageKind: "internal",
    });
  }

  rebalanceInternal(parent);
}

function flattenLayout(tree) {
  const viewportWidth = viewport.clientWidth;
  const viewportHeight = viewport.clientHeight;
  const leaves = leavesOf(tree);
  const width = Math.max(viewportWidth, leaves.length * 120 + 80);
  stage.style.width = `${width}px`;
  edgeSvg.style.width = `${width}px`;
  edgeSvg.setAttribute("viewBox", `0 0 ${width} ${viewportHeight}`);
  const positions = new Map();
  const maxDepth = Math.max(0, height(tree) - 1);
  const side = width < 500 ? 30 : 42;
  const usable = Math.max(180, width - side * 2);
  const levelGap = maxDepth ? Math.min(125, (viewportHeight - 145) / maxDepth) : 0;
  let leafIndex = 0;

  function place(node, depth, parentId = null) {
    let x;
    if (node.leaf) {
      x = side + ((leafIndex + 0.5) * usable) / Math.max(leaves.length, 1);
      leafIndex += 1;
    } else {
      const childXs = node.children.map((child) => place(child, depth + 1, node.id));
      x = childXs.reduce((sum, value) => sum + value, 0) / childXs.length;
    }
    const y = maxDepth ? 48 + depth * levelGap : viewportHeight * 0.38;
    const nodeWidth = Math.max(92, 20 + Math.max(1, node.keys.length) * 42);
    positions.set(node.id, { node, x, y, width: nodeWidth, parentId, depth });
    return x;
  }

  place(tree, 0);
  return positions;
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderTree(frame) {
  const positions = flattenLayout(frame.tree);
  const present = new Set(positions.keys());
  const activeKeys = new Set(frame.activeKeys);
  const activeNodes = new Set(frame.activeNodes);
  const splitNodes = new Set(frame.splitNodes);

  for (const [id, element] of nodeEls) {
    if (!present.has(id)) {
      element.classList.add("leaving");
      window.setTimeout(() => element.remove(), 300);
      nodeEls.delete(id);
    }
  }

  for (const [id, pos] of positions) {
    let element = nodeEls.get(id);
    const isNew = !element;
    if (!element) {
      element = document.createElement("div");
      element.className = "tree-node";
      element.dataset.id = String(id);
      stage.appendChild(element);
      nodeEls.set(id, element);
      const parentPos = pos.parentId !== null ? positions.get(pos.parentId) : null;
      const startX = parentPos ? parentPos.x : pos.x;
      const startY = parentPos ? parentPos.y : pos.y - 18;
      element.style.opacity = "0";
      element.style.transform = `translate(${startX - pos.width / 2}px, ${startY}px) scale(.72)`;
    }

    element.style.width = `${pos.width}px`;
    element.className = [
      "tree-node",
      pos.node.leaf ? "leaf" : "internal",
      activeNodes.has(id) ? "active" : "",
      splitNodes.has(id) ? "split" : "",
    ].filter(Boolean).join(" ");

    const signature = `${pos.node.leaf}|${pos.node.next}|${pos.node.keys.join(",")}|${[...activeKeys].join(",")}|${frame.activeCellNodeId}`;
    if (element.dataset.signature !== signature) {
      const cells = pos.node.keys.length
        ? pos.node.keys.map((key) => `
          <span class="node-cell ${activeKeys.has(key) && (frame.activeCellNodeId === undefined || frame.activeCellNodeId === id) ? "hot" : ""}">
            <b>${esc(key)}</b>
            <small>${pos.node.leaf ? "row" : "max"}</small>
          </span>`).join("")
        : `<span class="empty-cell">empty leaf</span>`;
      element.innerHTML = `
        <div class="node-head"><span>PAGE ${id}</span><span>${pos.node.leaf ? `NEXT ${pos.node.next}` : "INTERNAL"}</span></div>
        <div class="node-cells">${cells}</div>`;
      element.dataset.signature = signature;
    }

    requestAnimationFrame(() => {
      element.style.opacity = "1";
      element.style.transform = `translate(${pos.x - pos.width / 2}px, ${pos.y}px) scale(1)`;
    });
  }

  if (frame.pendingKey !== undefined || frame.pendingText) {
    const target = positions.get(frame.pendingNodeId) || positions.get(frame.activeNodes.at(-1)) || positions.get(0);
    if (!pendingEl) {
      pendingEl = document.createElement("div");
      pendingEl.className = "pending-cell";
      stage.appendChild(pendingEl);
    }
    const label = frame.pendingText ?? frame.pendingKey;
    pendingEl.innerHTML = `<b>${esc(label)}</b><small>${esc(frame.pendingSubtext || "pending")}</small>`;
    if (target) {
      const x = Math.min(stage.offsetWidth - 54, target.x + target.width / 2 + 8);
      const y = Math.max(10, target.y - 8);
      pendingEl.style.transform = `translate(${x}px, ${y}px)`;
    }
  } else if (pendingEl) {
    pendingEl.remove();
    pendingEl = null;
  }

  const activeEdges = new Set(frame.activeEdges);
  const currentEdges = new Set();
  for (const [, pos] of positions) {
    if (pos.parentId === null) continue;
    const parent = positions.get(pos.parentId);
    const edgeId = `${parent.node.id}-${pos.node.id}`;
    currentEdges.add(edgeId);
    let path = edgeEls.get(edgeId);
    if (!path) {
      path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      edgeSvg.appendChild(path);
      edgeEls.set(edgeId, path);
    }
    const y1 = parent.y + 70;
    const y2 = pos.y;
    const mid = (y1 + y2) / 2;
    path.setAttribute("d", `M ${parent.x} ${y1} C ${parent.x} ${mid}, ${pos.x} ${mid}, ${pos.x} ${y2}`);
    path.setAttribute("class", `edge ${activeEdges.has(edgeId) ? "active" : ""}`);
  }
  for (const [edgeId, path] of edgeEls) {
    if (currentEdges.has(edgeId)) continue;
    path.remove();
    edgeEls.delete(edgeId);
  }

  const leafPositions = [...positions.values()].filter((item) => item.node.leaf);
  const currentLeafLinks = new Set();
  leafPositions.forEach((item) => {
    if (item.node.next === 0) return;
    const next = positions.get(item.node.next);
    if (!next) return;
    const linkId = `leaf-${item.node.id}-${next.node.id}`;
    currentLeafLinks.add(linkId);
    let path = leafLinkEls.get(linkId);
    if (!path) {
      path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      edgeSvg.appendChild(path);
      leafLinkEls.set(linkId, path);
    }
    const y = item.y + 78;
    const startX = item.x + item.width / 2 - 5;
    const endX = next.x - next.width / 2 + 2;
    const handle = Math.max(2, Math.min(18, Math.abs(endX - startX) * 0.34));
    path.setAttribute("d", `M ${startX} ${y} C ${startX + handle} ${y + 18}, ${endX - handle} ${y + 18}, ${endX} ${y}`);
    path.setAttribute("class", `leaf-link ${activeEdges.has(linkId) ? "active" : ""}`);
  });
  for (const [linkId, path] of leafLinkEls) {
    if (currentLeafLinks.has(linkId)) continue;
    path.remove();
    leafLinkEls.delete(linkId);
  }

  if (stage.offsetWidth > viewport.clientWidth) {
    const focusId = frame.activeNodes[frame.activeNodes.length - 1] ?? 0;
    const focus = positions.get(focusId) || positions.get(0);
    if (focus) {
      requestAnimationFrame(() => viewport.scrollTo({
        left: Math.max(0, focus.x - viewport.clientWidth / 2),
        behavior: "smooth",
      }));
    }
  }
}

function renderTrace(frame) {
  document.getElementById("phase").textContent = frame.phase;
  document.getElementById("frame-count").textContent =
    `${String(frameIndex + 1).padStart(2, "0")} / ${String(frames.length).padStart(2, "0")}`;
  document.getElementById("step-title").textContent = frame.title;
  document.getElementById("step-detail").textContent = frame.detail;
  document.getElementById("stat-height").textContent = height(frame.tree);
  document.getElementById("stat-pages").textContent = countPages(frame.tree);
  document.getElementById("stat-rows").textContent = countRows(frame.tree);
  document.getElementById("timeline-fill").style.width =
    `${frames.length <= 1 ? 100 : (frameIndex / (frames.length - 1)) * 100}%`;

  document.querySelectorAll("#pipeline [data-stage]").forEach((element) => {
    element.classList.toggle("active", frame.pipeline.includes(element.dataset.stage));
  });

  const preset = frame.code;
  document.getElementById("code-label").textContent = preset.label;
  document.getElementById("code-kind").textContent = preset.kind || "SOURCE EXCERPT";
  document.getElementById("code-view").innerHTML = `<code>${preset.lines
    .map((line, index) => index === preset.hot ? `<span class="hot">${esc(line)}</span>` : esc(line))
    .join("\n")}</code>`;

  let selected = null;
  for (const id of frame.activeNodes) {
    selected = findNode(frame.tree, id);
    if (selected) break;
  }
  const kind = frame.pageKind || (selected && selected.leaf ? "leaf" : "internal");
  document.getElementById("page-kind").textContent = kind.toUpperCase();
  document.getElementById("page-map").innerHTML = kind === "leaf"
    ? '<span class="header-cell">14 B header</span><span class="body-cell">13 × 297 B cells max</span>'
    : '<span class="header-cell">14 B header incl. right child</span><span class="body-cell">3 × 8 B cells in source demo</span>';

  liveRegion.textContent = `${frame.title}. ${frame.detail}`;
}

function render(index) {
  if (!frames.length) return;
  frameIndex = Math.max(0, Math.min(index, frames.length - 1));
  const frame = frames[frameIndex];
  renderTree(frame);
  renderTrace(frame);
}

function stopPlayback() {
  if (playTimer) window.clearTimeout(playTimer);
  playTimer = null;
  const icon = document.querySelector("#guided .play-icon");
  if (icon) icon.textContent = "▶";
}

function frameDelay(frame) {
  const base = Number(document.getElementById("speed").value);
  if (/SPLIT|PENDING|MERGE|BORROW/.test(frame.phase)) return Math.round(base * 2.1);
  if (/RESULT|FOUND|BALANCED/.test(frame.phase)) return Math.round(base * 1.45);
  if (/PREPARE|EXECUTE|REPL/.test(frame.phase)) return Math.round(base * 0.72);
  return base;
}

function playFrom(index = 0) {
  stopPlayback();
  render(index);
  const icon = document.querySelector("#guided .play-icon");
  if (icon) icon.textContent = "Ⅱ";

  const tick = () => {
    if (frameIndex >= frames.length - 1) {
      stopPlayback();
      return;
    }
    render(frameIndex + 1);
    playTimer = window.setTimeout(tick, frameDelay(frames[frameIndex]));
  };
  playTimer = window.setTimeout(tick, frameDelay(frames[frameIndex]));
}

function playCurrentOperation() {
  playFrom(0);
}

function buildTree() {
  resetModel();
  frames = [];
  [18, 7, 25, 3, 11, 21, 30, 1, 5, 9, 14, 23, 28].forEach((key) => insertKey(key, {}, true));
  capture("A three-level page tree", "Small capacities make leaf and internal splits easy to see. Real pages usually have a much higher fanout.", {
    phase: "BUILT",
    pipeline: ["execute", "cursor", "pager"],
    code: code.parent,
    activeNodes: [0],
    pageKind: "internal",
  });
  playFrom(0);
}

function guidedRun() {
  if (playTimer) {
    stopPlayback();
    return;
  }
  resetModel();
  frames = [];
  [12, 5, 19, 3, 8, 15, 22, 1, 6, 10, 17, 25].forEach((key) => insertKey(key, {}, true));
  findKeyAppend(17);
  scanTree(true);
  deleteKeyAppend(10);
  capture("The same tree remains directly editable", "Type another command below or step through any recorded state with the arrows.", {
    phase: "READY",
    pipeline: [],
    code: code.print,
    activeNodes: [0],
    pageKind: root.leaf ? "leaf" : "internal",
  });
  playFrom(0);
}

function findKeyAppend(key) {
  capture(`Visual FIND ${key}`, "This lab-only control exposes the point-lookup path used inside insertion.", {
    phase: "LAB EXTENSION",
    pipeline: ["cursor"],
    code: code.internalFind,
  });
  const result = searchLeaf(key, "FIND*", { includeExecute: false });
  capture(`Found row ${key}`, `The complete row lives in leaf page ${result.node.id}.`, {
    phase: "FOUND",
    pipeline: ["cursor", "pager"],
    code: code.leafFind,
    activeNodes: [result.node.id],
    activeKeys: [key],
    activeCellNodeId: result.node.id,
    pageKind: "leaf",
  });
}

function deleteKeyAppend(key) {
  capture(`Conceptual delete of ${key}`, "This final scene explores the balancing operation that the C program has not implemented.", {
    phase: "DELETE*",
    pipeline: ["cursor"],
    code: code.remove,
  });
  const result = searchLeaf(key, "DELETE*", { includeExecute: false });
  const target = result.node;
  if (!result.found) return;
  target.keys.splice(result.index, 1);
  target.rows.splice(result.index, 1);
  capture(`Remove key ${key}`, "The remaining cells close the gap, then the visualizer checks the leaf occupancy and its siblings.", {
    phase: "DELETE*",
    pipeline: ["cursor", "pager"],
    code: code.remove,
    activeNodes: [target.id],
    pageKind: "leaf",
  });
  if (target !== root && target.keys.length < MIN_LEAF_KEYS) {
    rebalanceLeaf(target);
    return;
  }
  recompute(root);
  capture("The leaf still has enough rows", "No structural repair is needed after this removal.", {
    phase: "BALANCED",
    pipeline: ["cursor", "pager"],
    code: code.remove,
    activeNodes: [target.id],
    pageKind: "leaf",
  });
}

function parseUint32(value, command) {
  const key = Number(value);
  if (!Number.isInteger(key) || key < 0 || key > 0xffffffff) {
    throw new Error(`${command} needs an unsigned 32-bit integer key.`);
  }
  return key;
}

function parseCommand(raw) {
  const input = raw.trim();
  const parts = input.split(/\s+/);
  const op = (parts[0] || "").toLowerCase();

  if (op === "insert") {
    if (parts.length < 4) throw new Error("INSERT needs an ID, username and email address.");
    const key = parseUint32(parts[1], "INSERT");
    if (parts[2].length > 32) throw new Error("The tutorial username limit is 32 characters.");
    if (parts[3].length > 255) throw new Error("The tutorial email limit is 255 characters.");
    insertKey(key, { username: parts[2], email: parts[3] });
  } else if (op === "find") {
    const key = parseUint32(parts[1], "FIND");
    findKey(key);
  } else if (op === "select") {
    if (parts.length !== 1) throw new Error("The tutorial only implements a full SELECT with no key argument.");
    scanTree();
  } else if (op === "delete") {
    const key = parseUint32(parts[1], "DELETE");
    deleteKey(key);
  } else if (op === ".btree") {
    frames = [];
    capture("Print the current page tree", "The real meta-command recursively prints internal pages, leaf pages and their sorted keys.", {
      phase: "META",
      pipeline: ["repl", "pager"],
      code: code.print,
      activeNodes: [...collectIds(root)],
      pageKind: root.leaf ? "leaf" : "internal",
    });
  } else if (op === ".constants") {
    frames = [];
    capture("The compiled page constants", "PAGE_SIZE 4096 · ROW_SIZE 293 · LEAF_CELL_SIZE 297 · LEAF_MAX_CELLS 13", {
      phase: "META",
      pipeline: ["repl"],
      code: code.print,
      activeNodes: [0],
      pageKind: root.leaf ? "leaf" : "internal",
    });
  } else if (op === "reset") {
    resetModel();
  } else {
    throw new Error("Use INSERT, full SELECT, .BTREE or .CONSTANTS. FIND and DELETE are labelled visual extensions.");
  }
}

function collectIds(node, out = []) {
  out.push(node.id);
  node.children.forEach((child) => collectIds(child, out));
  return out;
}

document.getElementById("command-form").addEventListener("submit", (event) => {
  event.preventDefault();
  stopPlayback();
  try {
    parseCommand(commandInput.value);
    playCurrentOperation();
  } catch (error) {
    frames = [];
    capture("Command rejected", error.message, {
      phase: "INPUT ERROR",
      pipeline: ["repl", "prepare"],
      code: code.prepare,
    });
    render(0);
  }
});

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    commandInput.value = button.dataset.command;
    document.getElementById("command-form").requestSubmit();
  });
});

document.getElementById("guided").addEventListener("click", guidedRun);
document.getElementById("populate").addEventListener("click", buildTree);
document.getElementById("scan").addEventListener("click", () => {
  scanTree();
  playCurrentOperation();
});
document.getElementById("reset").addEventListener("click", () => {
  stopPlayback();
  resetModel();
  render(0);
});
document.getElementById("prev-frame").addEventListener("click", () => {
  stopPlayback();
  render(frameIndex - 1);
});
document.getElementById("next-frame").addEventListener("click", () => {
  stopPlayback();
  render(frameIndex + 1);
});

let observedViewportWidth = viewport.clientWidth;
let observedViewportHeight = viewport.clientHeight;
let resizeFrame = null;

new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  if (
    Math.abs(width - observedViewportWidth) < 0.5 &&
    Math.abs(height - observedViewportHeight) < 0.5
  ) return;

  observedViewportWidth = width;
  observedViewportHeight = height;
  if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null;
    render(frameIndex);
  });
}).observe(viewport);

resetModel();
render(0);

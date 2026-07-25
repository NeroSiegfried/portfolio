---
title: "How My C Database Stores Rows in a B+ Tree"
excerpt: "From REPL parsing and 4 KB pages to binary search, linked leaves and recursive node splitting."
series: c-database-supp
publishedAt: 2026-07-25
---

I built this database while following cstack's [Build Your Own SQLite tutorial](https://cstack.github.io/db_tutorial/). My branch currently reaches [part 14](https://cstack.github.io/db_tutorial/parts/part14.html), where internal nodes can split and grow the tree beyond two levels. The B+ tree work begins in [part 7](https://cstack.github.io/db_tutorial/parts/part7.html).

The current scope is narrow. The program accepts one fixed row shape with an integer ID, username and email address. It supports `insert` and a full-table `select`. The other commands are `.btree`, `.constants` and `.exit`. There is no `where`, `update`, `delete`, schema definition, join, transaction log or query planner in the [checked-in implementation](https://github.com/NeroSiegfried/C-Database/tree/2a2974287d2ef2ef919711641b5a2cffee099ccf).

That small scope makes it possible to follow one row from the line typed into the REPL to the bytes written into a page.

## From the REPL to a page

The REPL reads one line at a time. A line beginning with a dot goes to the meta-command handler. Every other line goes through `prepare_statement()`.

```c
PrepareResult prepare_statement(InputBuffer* input_buffer, Statement* statement) {
    if (strncmp(input_buffer -> buffer, "insert", 6) == 0) {
        return prepare_insert(input_buffer, statement);
    }
    if (strcmp(input_buffer -> buffer, "select") == 0) {
        statement -> type = STATEMENT_SELECT;
        return PREPARE_SUCCESS;
    }

    return PREPARE_UNRECOGNIZED_STATEMENT;
}
```

This is a small command parser. `prepare_insert()` uses `strtok()` to read an ID, username and email into a `Statement`. `execute_statement()` then dispatches according to the statement type.

An insert follows this route.

1. `execute_insert()` takes the row ID as its key.
2. `table_find()` starts at page 0, which is always the root.
3. `internal_node_find()` chooses child pages until it reaches a leaf.
4. `leaf_node_find()` returns a cursor at the existing key or the place where the key belongs.
5. `leaf_node_insert()` writes the row into that position or starts a split when the leaf is full.

A full select begins with `table_start()`, reads the row under the cursor, advances through the leaf and follows the link to the next leaf. The executor never handles file offsets directly. The cursor and pager keep those details below it.

```c
typedef struct {
    Table* table;
    uint32_t page_num;
    uint32_t cell_num;
    bool end_of_table;
} Cursor;
```

The cursor identifies a cell inside a page. `cursor_value()` asks the pager for that page and calculates the address of the row bytes inside the leaf.

## The 4 KB page layout

The database file is an array of fixed 4096-byte pages. A page number maps to a file offset by multiplying it by 4096. `get_page()` allocates memory and reads from disk on the first access. Later requests return the cached pointer. New pages are appended using the current page count.

The pager uses a fixed array of 100 pointers. It has no eviction policy. On `.exit`, `db_close()` writes every loaded page back to the file. There are no dirty bits, journal, write-ahead log, checksums or `fsync()` calls.

The row and leaf layout at the current commit works out as follows.

| Region | Bytes | Contents |
| --- | ---: | --- |
| Row | 293 | 4-byte ID, 33-byte username and 256-byte email |
| Common node header | 6 | Node type, root flag and parent page number |
| Leaf-only header | 8 | Cell count and next-leaf page number |
| Complete leaf header | 14 | Common header plus leaf fields |
| Leaf cell | 297 | 4-byte key plus one serialized row |
| Leaf capacity | 13 cells | Floor of 4082 divided by 297 |

A new file starts with page 0 initialized as an empty leaf and marked as the root. Thirteen rows fit in that page. The fourteenth insertion is the first one that has to change the shape of the tree.

Internal pages use the same 6-byte common header, followed by a key count and a separate right-child page number. Each internal cell contains a child page number and the maximum key in that child. Both fields are 4 bytes.

The checked-in code sets `INTERNAL_NODE_MAX_CELLS` to 3 so internal splits occur in small tests. This is a teaching value. The defined layout has room for 510 8-byte cells after its 14-byte header.

## Why this is a B+ tree

The tutorial usually says B-tree, though [part 7](https://cstack.github.io/db_tutorial/parts/part7.html) gives the more precise name. Row values live only in leaf pages. Internal pages hold routing keys and child page numbers. Leaf pages are joined from left to right with sibling pointers. Those are the features of a B+ tree.

Keeping rows out of internal pages gives the routing levels a high fanout. One internal page can direct a search toward many child pages. Every leaf remains at the same depth, so a lookup takes one page decision per level. The tree grows upward when the root splits.

The routing key used here is the maximum key in the child to its left. Given internal keys such as 7, 15 and 24, a search for 12 takes the first child whose maximum is at least 12. A key larger than every stored maximum goes through the separate right-child pointer.

## Binary search at each level

Both node types keep their keys in order. Internal search uses a lower-bound binary search to choose a child.

```c
uint32_t internal_node_find_child(void* node, uint32_t key) {
    uint32_t num_keys = *internal_node_num_keys(node);
    uint32_t min_index = 0;
    uint32_t max_index = num_keys;

    while (min_index != max_index) {
        uint32_t index = (min_index + max_index) / 2;
        uint32_t key_to_right = *internal_node_key(node, index);
        if (key_to_right >= key) {
            max_index = index;
        } else {
            min_index = index + 1;
        }
    }

    return min_index;
}
```

`internal_node_find()` loads the selected child page and repeats the process when that child is also internal. Once it reaches a leaf, `leaf_node_find()` runs the same kind of binary search over row IDs. Its result works for lookup and insertion. An existing key returns its current cell. A missing key returns the position where it should be inserted.

The search cost grows with the height of the tree. The work inside one page is logarithmic in that page's cell count. A full `select` visits every leaf cell after finding the left edge.

## Insertion and leaf splitting

When a leaf has room, insertion shifts later cells one place to the right, writes the key and serializes the row beside it. The sorted order is preserved within the page.

A full leaf needs another page. `leaf_node_split_and_insert()` allocates it, connects the leaf links and distributes the thirteen existing cells plus the new cell across the two pages. With the current constants, each side receives seven cells.

```c
*leaf_node_next_leaf(new_node) = *leaf_node_next_leaf(old_node);
*leaf_node_next_leaf(old_node) = new_page_num;
```

If the old leaf was page 0, it was also the root. `create_new_root()` copies its contents into a new left-child page, leaves the newly allocated leaf on the right and reinitializes page 0 as an internal node. The new root receives one routing key and two child pointers. This keeps the root page number stable while increasing the height by one.

A later leaf split usually happens below an existing parent. The code records the old leaf's previous maximum, redistributes the cells, updates that routing key and inserts the new child into the parent according to its maximum key.

The same pressure eventually reaches an internal page. `internal_node_split_and_insert()` moves the higher child entries into a new internal page, repairs their parent pointers and places the incoming child on the correct side. A full parent can split in turn. Splitting the root creates a new level. Splitting any other internal page inserts its new sibling into the next parent up.

This recursive split path keeps all leaves at the same depth as the file grows.

## How a full select crosses the tree

A full scan starts with `table_find(table, 0)`. Negative IDs are rejected during preparation, so that search lands at the first position in the leftmost leaf. `execute_select()` deserializes the row under the cursor and calls `cursor_advance()` until the end flag is set.

```c
void cursor_advance(Cursor* cursor) {
    uint32_t page_num = cursor -> page_num;
    void* node = get_page(cursor -> table -> pager, page_num);

    cursor -> cell_num += 1;
    if (cursor -> cell_num >= (*leaf_node_num_cells(node))){
        uint32_t next_page_num = *leaf_node_next_leaf(node);
        if (next_page_num == 0) {
            cursor -> end_of_table = true;
        } else {
            cursor -> page_num = next_page_num;
            cursor -> cell_num = 0;
        }
    }
}
```

The sibling link avoids returning to the root after every leaf. It also makes the output naturally ordered by ID. The first descent costs one search through the tree. The remaining scan is linear in the number of rows.

## Try the tree

The lab below uses a deliberately small three-key node capacity so splits happen quickly. Add keys in or out of order and follow the highlighted path from the root to the target leaf. A pending row stays beside a full node until the split has made room for it. The fourth key is never drawn inside a three-key page. During a split, cells move on one continuous canvas, the sibling link reconnects and the parent separator moves into place.

The compact page strip beside the trace keeps the source layout visible, including the 13-row capacity of a 4 KB leaf. Page IDs in the diagram are illustrative. The page counter reports nodes currently attached to the teaching tree. A conceptual merge makes that number fall, while the tutorial pager has no free-page list and would keep the allocated pages.

{{snippet:bplus-tree-lab wide height:780}}

The Find and Delete controls are visual lab extensions. Find exposes the point-lookup path already used internally during insertion, though the repository has no `find` statement. It also has no `delete` statement or deletion routine.

Deletion is useful for showing the other half of the balancing rules. A key is removed from its leaf first. A leaf with enough remaining keys only needs its parent separator updated when its maximum changes. An underfilled leaf can borrow from a sibling or merge with one. A merge removes a child entry from the parent, which can make the parent underflow and repeat the process one level higher. A root left with a single child can contract and make that child the new root.

The animation demonstrates those standard B+ tree operations without presenting them as part of the C program.

## How the layout relates to SQLite and InnoDB

The tutorial borrows SQLite's broad architecture, though this database file has its own small format.

SQLite also stores a rowid table's payload in leaf pages while interior table pages contain rowid keys and child pointers. Its real [database file format](https://www.sqlite.org/fileformat.html) has several layers missing here. SQLite page size is stored in the file header and can range from 512 to 65536 bytes. Page 1 starts with a 100-byte database header. B-tree pages use an 8-byte leaf header or 12-byte interior header, followed by a cell pointer array, free space, cell content and an optional reserved region. Records use variable-length integers and large payloads can continue through overflow pages. A database can also contain separate B-trees for tables and indexes.

InnoDB provides another useful comparison. Its ordinary indexes are [B-tree structures with records in leaf pages](https://dev.mysql.com/doc/refman/8.4/en/innodb-physical-structure.html), and the default index page size is 16 KB. Every InnoDB table has a [clustered index](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html) that stores the row data, usually under the primary key. A secondary index stores its indexed columns together with the primary key columns, then uses that primary key to find the row in the clustered index.

The C database has one tree keyed by `Row.id`, with the complete row stored in the leaf. The closest comparison is a small clustered index. It has no secondary indexes or schema layer.

## The current boundary

At commit [`2a29742`](https://github.com/NeroSiegfried/C-Database/commit/2a2974287d2ef2ef919711641b5a2cffee099ccf), the implemented feature set covers `insert`, page-backed persistence and a full ordered `select`. The pager is a fixed cache with no eviction. The file has a 100-page limit. Rows have one compiled-in shape. The binary format writes C values directly and has no compatibility header. After page 0 becomes internal, the pinned [`execute_insert()`](https://github.com/NeroSiegfried/C-Database/blob/2a2974287d2ef2ef919711641b5a2cffee099ccf/main.c#L898-L913) still reads duplicate-check data from page 0 instead of the cursor's destination leaf, so duplicate rejection is unreliable in a multi-level tree.

Following an input line through preparation, execution, cursor movement, binary search, page allocation and a split gave me a concrete picture of what an index is doing underneath a query.

## Further reading

- [Part 7 on B+ trees](https://cstack.github.io/db_tutorial/parts/part7.html)
- [Part 8 on leaf-page format](https://cstack.github.io/db_tutorial/parts/part8.html)
- [Part 9 on ordered insertion and binary search](https://cstack.github.io/db_tutorial/parts/part9.html)
- [Part 10 on leaf splitting](https://cstack.github.io/db_tutorial/parts/part10.html)
- [Part 11 on recursive search](https://cstack.github.io/db_tutorial/parts/part11.html)
- [Part 12 on linked-leaf scans](https://cstack.github.io/db_tutorial/parts/part12.html)
- [Part 13 on parent updates](https://cstack.github.io/db_tutorial/parts/part13.html)
- [Part 14 on internal-node splitting](https://cstack.github.io/db_tutorial/parts/part14.html)
- [The audited C source at the current head](https://github.com/NeroSiegfried/C-Database/blob/2a2974287d2ef2ef919711641b5a2cffee099ccf/main.c)
- [SQLite's official file-format documentation](https://www.sqlite.org/fileformat.html)
- [MySQL's official InnoDB index documentation](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html)

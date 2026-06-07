import boto3

def list_instances():
    ec2 = boto3.client('ec2', region_name='us-east-1')
    response = ec2.describe_instances(
        Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
    )

    print(f"{'Name':<20} | {'Instance ID':<20} | {'Public IP':<15} | {'Launch Time (UTC)':<25}")
    print("-" * 85)

    for reservation in response['Reservations']:
        for inst in reservation['Instances']:
            name = "N/A"
            for tag in inst.get('Tags', []):
                if tag['Key'] == 'Name':
                    name = tag['Value']

            print(f"{name:<20} | {inst['InstanceId']:<20} | {inst.get('PublicIpAddress', 'N/A'):<15} | {str(inst['LaunchTime']):<25}")

if __name__ == "__main__":
    list_instances()
    print("\n💡 Tip: The one with the most RECENT Launch Time is likely the one where you successfully set the password.")

import asyncio
from bleak import BleakClient

address = "CBFC583E-52DB-2FCD-A788-EFDE75622E13"

UUIDS = [
    "0000ae02-0000-1000-8000-00805f9b34fb",
    "00000af7-0000-1000-8000-00805f9b34fb",
    "00000af2-0000-1000-8000-00805f9b34fb",
    "00002a37-0000-1000-8000-00805f9b34fb"
]

def callback(sender, data):
    values = list(data)

    print("UUID:", sender)
    print("Raw Packet:", values)

    # possible decoding
    if len(values) > 1:
        hr = values[1]
        print("Heart Rate:", hr, "BPM")

    print("---------------------")


async def main():

    async with BleakClient(address) as client:

        print("Connected:", client.is_connected)

        for uuid in UUIDS:
            try:
                await client.start_notify(uuid, callback)
                print("Subscribed to:", uuid)
            except:
                pass

        print("Listening for smartwatch data...")
        await asyncio.sleep(120)

asyncio.run(main())
import asyncio
from bleak import BleakClient

address = "CBFC583E-52DB-2FCD-A788-EFDE75622E13"

async def show_properties():
    async with BleakClient(address) as client:
        print("Connected:", client.is_connected)

        for service in client.services:
            print("Service:", service.uuid)

            for char in service.characteristics:
                print("   Characteristic:", char.uuid, " | Properties:", char.properties)

asyncio.run(show_properties())
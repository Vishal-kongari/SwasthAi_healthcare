import asyncio
from bleak import BleakClient

address = "CBFC583E-52DB-2FCD-A788-EFDE75622E13"

async def get_services():
    async with BleakClient(address) as client:
        print("Connected:", client.is_connected)

        # services are already resolved automatically
        for service in client.services:
            print("Service:", service.uuid)

            for char in service.characteristics:
                print("   Characteristic:", char.uuid)

asyncio.run(get_services())
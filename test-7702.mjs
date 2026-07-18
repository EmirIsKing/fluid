import { UniversalAccount } from '@particle-network/universal-account-sdk';

async function main() {
  const ua = new UniversalAccount({
    projectId: '75a4d7d7-94b2-4c82-a23f-42ec02605631',
    projectClientKey: 'chJ30oBXWmm8tU2NP9Korm9hAuzGMyGALhnPMXUc',
    projectAppUuid: 'onepay',
    smartAccountOptions: {
      name: 'UNIVERSAL',
      version: '2.0.1',
      ownerAddress: '0x9965507b1a0595c5411cc4457ed061b402c82f24',
      useEIP7702: true
    }
  });

  console.log('Fetching smart account options...');
  await ua.getSmartAccountOptions();

  console.log('Testing createTransferTransaction...');
  try {
    const tx = await ua.createTransferTransaction({
      token: {
        chainId: 8453,
        // Let's test with a checksummed address first
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      },
      amount: '0.000001',
      receiver: '0x9965507B1a0595C5411CC4457ED061b402C82F24' // Checksummed receiver
    });
    console.log('Success:', tx);
  } catch (err) {
    console.error('Failed with checksummed address:', err);
    
    console.log('Retrying with lowercased addresses...');
    try {
      const tx = await ua.createTransferTransaction({
        token: {
          chainId: 8453,
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' // Lowercase
        },
        amount: '0.000001',
        receiver: '0x9965507b1a0595c5411cc4457ed061b402c82f24' // Lowercase
      });
      console.log('Success with lowercase:', tx);
    } catch (err2) {
      console.error('Failed with lowercase too:', err2);
    }
  }
}

main().catch(err => console.error('Error in main:', err));

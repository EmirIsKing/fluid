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
      useEIP7702: false // Set to false to see what options and assets are returned
    }
  });

  console.log('Fetching smart account options...');
  const options = await ua.getSmartAccountOptions();
  console.log('Smart Account Options:', options);

  console.log('Fetching primary assets...');
  const assets = await ua.getPrimaryAssets();
  console.log('Primary Assets:', JSON.stringify(assets, null, 2));
}

main().catch(err => console.error('Error in main:', err));

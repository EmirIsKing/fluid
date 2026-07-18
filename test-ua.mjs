import { UniversalAccount } from '@particle-network/universal-account-sdk';
const ua = new UniversalAccount({
  projectId: '75a4d7d7-94b2-4c82-a23f-42ec02605631',
  projectClientKey: 'chJ30oBXWmm8tU2NP9Korm9hAuzGMyGALhnPMXUc',
  projectAppUuid: '3d38db15-62bb-49e5-9d32-d17e753443cd',
  smartAccountOptions: {
    name: 'UNIVERSAL',
    version: '2.0.1',
    ownerAddress: '0x9965507B1a0595C5411CC4457ED061b402C82F24'
  }
});
ua.getPrimaryAssets().then(res => console.log(JSON.stringify(res, null, 2))).catch(err => console.error('ERROR:', err));

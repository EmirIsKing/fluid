import { UniversalAccount } from '@particle-network/universal-account-sdk';

async function main() {
  const ua = new UniversalAccount({
    projectId: '75a4d7d7-94b2-4c82-a23f-42ec02605631',
    projectClientKey: 'chJ30oBXWmm8tU2NP9Korm9hAuzGMyGALhnPMXUc',
    projectAppUuid: 'onepay',
    smartAccountOptions: {
      name: 'UNIVERSAL',
      version: '2.0.1',
      ownerAddress: '0x9965507b1a0595c5411cc4457ed061b402c82f24', // Lowercased
      useEIP7702: true
    }
  });

  const originalRequest = ua.request;
  ua.request = async (method, params) => {
    console.log('--- INTERCEPTED REQUEST ---');
    console.log('Method:', method);
    console.log('Params:', JSON.stringify(params, null, 2));
    try {
      const res = await originalRequest.call(ua, method, params);
      console.log('Result:', JSON.stringify(res, null, 2));
      return res;
    } catch (err) {
      console.error('Request failed:', err);
      throw err;
    }
  };

  console.log('Fetching smart account options...');
  const options = await ua.getSmartAccountOptions();
  console.log('Smart Account Options:', options);

  console.log('Calling getEIP7702Auth...');
  const auth = await ua.getEIP7702Auth([8453]);
  console.log('getEIP7702Auth Result:', JSON.stringify(auth, null, 2));
}

main().catch(err => console.error('Error in main:', err));

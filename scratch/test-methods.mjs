import { UniversalAccount } from '@particle-network/universal-account-sdk';

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

console.log('Methods on UniversalAccount instance:');
let currentObj = ua;
do {
  Object.getOwnPropertyNames(currentObj).forEach(prop => {
    if (typeof ua[prop] === 'function') {
      console.log(' -', prop);
    }
  });
} while ((currentObj = Object.getPrototypeOf(currentObj)));

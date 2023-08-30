import { ApiPromise, WsProvider } from '@polkadot/api';
import { JSX, onCleanup, createSignal, createEffect } from 'solid-js';

import UsageBar from './UsageBar';
import StatusBar from './StatusBar';

interface ContainerProps {
  container: {
    id: number;
    hostname: string;
    status: string;
    cpu: number;
    memory_used: number;
    memory_total: number;
    netin: number;
    netout: number;
    netin_rate: number;
    netout_rate: number;
  };
}

const OFFICIAL_ENDPOINTS = {
  'Polkadot': 'wss://rpc.polkadot.io',
  'Kusama': 'wss://kusama-rpc.polkadot.io',
  'Westend': 'wss://westend-rpc.polkadot.io',
  'Polkadot Asset Hub': 'wss://polkadot-asset-hub-rpc.polkadot.io',
  'Polkadot Bridge Hub': 'wss://polkadot-bridge-hub-rpc.polkadot.io',
  'Polkadot Collectives': 'wss://polkadot-collectives-rpc.polkadot.io',
  'Kusama Asset Hub': 'wss://kusama-asset-hub-rpc.polkadot.io',
  'Kusama Bridge Hub': 'wss://kusama-bridge-hub-rpc.polkadot.io',
  'Westend Asset Hub': 'wss://westend-asset-hub-rpc.polkadot.io',
  'Westend Bridge Hub': 'wss://westend-bridge-hub-rpc.polkadot.io',
  'Westend Collectives': 'wss://westend-collectives-rpc.polkadot.io',
  'Encointer': 'wss://kusama.api.encointer.org'
};

const role = {
  '1': 'Validator',
  '2': 'Bootnode',
  '3': 'RPC Endpoint',
  '4': 'Collator',
  '5': 'Bootnode',
  '6': 'RPC Endpoint'
}[firstDigit];

// Network mapping based on the second digit for primary networks
const primaryNetworks = {
  '1': 'Polkadot',
  '2': 'Kusama',
  '3': 'Westend'
};

// Network mapping for parachains
const parachains = {
  '0': 'Encointer',
  '1': 'Polkadot Asset Hub',
  '2': 'Kusama Asset Hub',
  '3': 'Westend Asset Hub',
  '4': 'Polkadot Bridge Hub',
  '5': 'Kusama Bridge Hub',
  '6': 'Westend Bridge Hub',
  '7': 'Polkadot Collectives Hub',
  '8': 'Kusama Collectives Hub',
  '9': 'Westend Collectives Hub'
};

export default function ContainerInfo(props: ContainerProps): JSX.Element {
  const [blockHeight, setBlockHeight] = createSignal(0);
  const [latestOfficialBlockHeight, setLatestOfficialBlockHeight] = createSignal(0);
  let api: ApiPromise;

  const fetchBlockHeight = async () => {
    const wsUrl = `wss://${props.container.hostname}:42${props.container.id}`;
    const wsProvider = new WsProvider(wsUrl);
    api = await ApiPromise.create({ provider: wsProvider });

    const latestHeader = await api.rpc.chain.getHeader();
    setBlockHeight(latestHeader.number.toNumber());
  };

  createEffect(fetchBlockHeight);

  onCleanup(() => {
    api?.disconnect();
  });

  const statusClass = props.container.status === 'running' ? 'bg-hex-AECE4B' : 'bg-red';

  const [firstDigit, secondDigit, thirdDigit] = String(props.container.id).split('');

  const role = roleMapping[firstDigit];

  let network;
  if (['1', '2', '3'].includes(firstDigit)) {
    network = primaryNetworks[secondDigit];
  } else {
    network = parachains[secondDigit];
  }

  const instance = thirdDigit === '0' ? '00' : thirdDigit;

  return (
    <div class="font-mono p-4 border my-4 filter-drop-shadow bg-hex-DFE9C5 rounded shadow-sm text-hex-010001">
      <h3 class="text-xl text-center">{props.container.hostname.split('.')[0]}</h3>
      {network && role && <p>{`${network} ${role} ${instance}`}</p>}
      <p>Status: <StatusBar status={props.container.status} /></p>
      <p>CPU Usage: <UsageBar current={props.container.cpu} max={1} /></p>
      <p>Memory Used: <UsageBar current={props.container.memory_used} max={props.container.memory_total} /></p>
      <p>Network In: {humanReadableSize(props.container.netin_rate)}</p>
      <p>Network Out: {humanReadableSize(props.container.netout_rate)}</p>
      <p>Block Height: {blockHeight()}</p>
      <p>Sync: <UsageBar current={blockHeight()} max={latestOfficialBlockHeight()} /></p>
    </div>
  );
}

function humanReadableSize(bytes: number): string {
  const sizes = ['Bit/s', 'KBit/s', 'MBit/s', 'GBit/s', 'TBit/s'];
  if (bytes === 0) return '0 Bit/s';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) return Math.round(bytes) + ' ' + sizes[i];
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}


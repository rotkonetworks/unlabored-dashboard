import { JSX } from 'solid-js';
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

export default function ContainerInfo(props: ContainerProps): JSX.Element {
  const statusClass = props.container.status === 'running' ? 'bg-hex-AECE4B' : 'bg-red'; // Neon green for running status

  // Extract the relevant digits from container.id
  const firstDigit = String(container.id)[0];
  const secondDigit = String(container.id)[1];
  const thirdDigit = String(container.id)[2];

  // Role mapping based on the first digit
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
    '1': 'Statemint',
    '2': 'Statemine',
    '3': 'Westmint',
    '4': 'Polkadot Bridge Hub',
    '5': 'Kusama Bridge Hub',
    '6': 'Westend Bridge Hub',
    '7': 'Polkadot Collectives Hub',
    '8': 'Kusama Collectives Hub',
    '9': 'Westend Collectives Hub'
  };

  // Determine which network mapping to use based on the first digit
  let network;
  if (['1', '2', '3'].includes(firstDigit)) {
    network = primaryNetworks[secondDigit];
  } else if (['4', '5', '6'].includes(firstDigit)) {
    network = parachains[secondDigit];
  }

  // Instance based on the third digit
  const instance = thirdDigit.padStart(2, '0');


  return (
    <div class="font-mono p-4 border my-4 filter-drop-shadow bg-hex-DFE9C5 rounded shadow-sm text-hex-010001">
      <h3 class="text-xl text-center">{props.container.hostname.split('.')[0]}</h3>
      {network && role && <p>{`${network} ${role} ${instance}`}</p>}
      <p>Status: <StatusBar status={props.container.status} /></p>
      <p>CPU Usage: <UsageBar current={props.container.cpu} max={1} /></p>
      <p>Memory Used: <UsageBar current={props.container.memory_used} max={props.container.memory_total} /></p>
      <p>Network In: {humanReadableSize(props.container.netin_rate)}</p>
      <p>Network Out: {humanReadableSize(props.container.netout_rate)}</p>
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

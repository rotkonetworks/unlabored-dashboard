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
  const statusClass = props.container.status === 'running' ? 'bg-green' : 'bg-red';

  return (
    <div class="p-3 border my-4 filter-drop-shadow filter-sepia-10 bg-blue-200 rounded shadow-sm">
      <h3 class="text-xl">{props.container.hostname}</h3>
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
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString(), 10);
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
}

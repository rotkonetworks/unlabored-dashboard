import { JSX } from 'solid-js';
import ContainerInfo from './ContainerInfo';
import UsageBar from './UsageBar';

interface NodeProps {
  node: {
    name: string;
    cpu: number;
    memory_used: number;
    memory_total: number;
    disk: number;
    containers: Array<typeof ContainerInfo>;
  };
}

export default function NodeInfo(props: NodeProps): JSX.Element {
  return (
    <div p-4 border m-2 bg-blue-300 filter-drop-shadow filter-sepia-10 rounded shadow-md>
      <h2 text-2xl fw-bold>{props.node.name}</h2>
      <p>CPU Usage: <UsageBar current={props.node.cpu} max={1} /></p>
      <h3 text-lg mt-3>Containers:</h3>
      <div mt-2>
        {props.node.containers.map(container => <ContainerInfo container={container} />)}
      </div>
    </div>
  );
}

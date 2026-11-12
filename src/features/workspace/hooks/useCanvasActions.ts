import { Connection, addEdge, Edge } from "@xyflow/react";
import { useCallback, Dispatch } from "react";
import { handleEdgeConnection } from "../utils/handleEdgeConnection";

type CanvasActionsParams = {
  setEdges: (edges: any) => void;
  setEdgeForRelationType: (edge: Edge | null) => void;
  edgeForRelationType: Edge | null;
  relationType: string;
  setRelationType: (type: string) => void;
  setRelationModalPosition: (position: { x: number; y: number }) => void;
}

export function useCanvasActions({setEdges, setEdgeForRelationType, edgeForRelationType, relationType, setRelationType, setRelationModalPosition}: CanvasActionsParams)
{

  const onConnect = useCallback(
    async (connection: Connection) => {


      const ok = await handleEdgeConnection(connection);
    if (!ok) return;

      setEdges((current: any) =>
        addEdge<Edge>(
          { ...connection, type: "relation", style: { stroke: "#596373" } },
          current,
        ),
      )

    },
    [setEdges, handleEdgeConnection],
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      setEdgeForRelationType(edge);
      setRelationType(String(edge.label ?? "1:N"));
      setRelationModalPosition({ x: event.clientX, y: event.clientY });
    },
    [],
  );

  const saveRelationType = useCallback((relationType: string) => {
    if (!edgeForRelationType) return;

    setEdges((current: any) =>
      current.map((edge: any) =>
        edge.id === edgeForRelationType.id
          ? { ...edge, label: relationType }
          : edge,
      ),
    );
    setEdgeForRelationType(null);
  }, [edgeForRelationType, relationType, setEdges]);


    return { onConnect, onEdgeClick, saveRelationType };
}
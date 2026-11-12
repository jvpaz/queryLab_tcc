import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';

export default function RelationEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="relation-edge"
          style={{transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`}}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

//transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
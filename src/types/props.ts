export type RelationModalProps = {
  relationModalPosition: { x: number; y: number };
  relationType: string;
  saveRelationType: (type: string) => void;
};
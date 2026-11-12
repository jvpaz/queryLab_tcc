import { RelationModalProps } from "@/types/props";

export default function RelationModal({ relationModalPosition, relationType, saveRelationType }: RelationModalProps)
{

    return (
      <>
    <div
          className="relation-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="relation-modal-title"
          style={{
            left: relationModalPosition.x,
            top: relationModalPosition.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <label htmlFor="relation-type">Cardinalidade</label>
          <select
            id="relation-type"
            className="select"
            value={relationType}
            onChange={(event) => 
              saveRelationType(event.target.value)}
          >
            <option value="1:1">1:1</option>
            <option value="1:N">1:N</option>
            <option value="N:N">N:N</option>
            <option value="">Remover</option>
          </select>
        </div>
        </>
    
)
}
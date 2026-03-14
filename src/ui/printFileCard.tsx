import { PrintPreviewIcon } from './PrintPreviewIcon'
import { joinClassNames } from './classNames'

type PrintFileCardProps = {
  name: string
  printTime: string
  weight: string
  className?: string
}

export function PrintFileCard({ name, printTime, weight, className }: PrintFileCardProps) {
  return (
    <article className={joinClassNames('print-file-card', className)} data-testid="print-file-card">
      <div className="print-file-preview" aria-hidden="true">
        <PrintPreviewIcon />
      </div>

      <div className="print-file-summary">
        <p className="print-file-name">{name}</p>

        <dl className="print-file-meta">
          <div className="print-file-meta-row">
            <dt>Время</dt>
            <dd>{printTime}</dd>
          </div>
          <div className="print-file-meta-row">
            <dt>Масса</dt>
            <dd>{weight}</dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

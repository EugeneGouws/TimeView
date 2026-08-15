import { TIMES_ROWS } from "../utils/timesData";

export default function TimesGrid() {
  return (
    <table className="times-grid">
      <tbody>
        {TIMES_ROWS.map(row => (
          <tr key={row.label}>
            <td className="times-grid-rowlabel">{row.label}</td>
            {row.cells.map((c, i) => (
              <td
                key={i}
                className={`times-grid-cell times-grid-cell--${c.kind}`}
              >
                <div className="times-grid-celllabel">{c.label}</div>
                <div className="times-grid-celltime">{c.time}</div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

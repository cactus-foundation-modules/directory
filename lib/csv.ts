// Hand-rolled RFC4180-ish CSV parse/serialise. papaparse isn't a dependency
// anywhere in this codebase and modules can't add npm packages, so this covers
// just what the import wizard needs: quoted fields, escaped "" quotes, and
// CRLF or LF line endings.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < normalised.length; i++) {
    const char = normalised[i]

    if (inQuotes) {
      if (char === '"') {
        if (normalised[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

function serialiseField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function serialiseCsv(rows: string[][]): string {
  return rows.map((row) => row.map(serialiseField).join(',')).join('\r\n')
}

export function rowsToObjects(rows: string[][]): Array<Record<string, string>> {
  const [header, ...body] = rows
  if (!header) return []
  return body.map((row) => {
    const obj: Record<string, string> = {}
    header.forEach((key, index) => {
      obj[key.trim()] = (row[index] ?? '').trim()
    })
    return obj
  })
}

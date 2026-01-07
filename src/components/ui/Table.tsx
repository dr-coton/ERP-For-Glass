import { ReactNode } from 'react';

interface Column {
  key: string;
  header: ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (item: any) => ReactNode;
}

interface TableProps {
  columns: Column[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowClick?: (item: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowDoubleClick?: (item: any) => void;
  selectedId?: number | string;
  emptyMessage?: string;
}

export default function Table({
  columns,
  data,
  onRowClick,
  onRowDoubleClick,
  selectedId,
  emptyMessage = '데이터가 없습니다.',
}: TableProps) {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`py-3 px-4 font-medium text-gray-500 ${
                  alignStyles[column.align || 'left']
                }`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const itemId = item.id ?? item.business_id ?? item.name ?? index;
              return (
                <tr
                  key={String(itemId)}
                  onClick={() => onRowClick?.(item)}
                  onDoubleClick={() => onRowDoubleClick?.(item)}
                  className={`
                    ${onRowClick || onRowDoubleClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                    ${selectedId === itemId ? 'bg-primary-50' : 'bg-white'}
                    transition-colors
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`py-3 px-4 ${alignStyles[column.align || 'left']}`}
                    >
                      {column.render
                        ? column.render(item)
                        : String(item[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

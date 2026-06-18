import { DataTable } from '#/components/table/data-table.tsx';
import {
  columns,
  type MembershipTableRow,
} from '#/components/dashboard/projects/membership-table/columns.tsx';

type MemberShipTableProps = {
  data: MembershipTableRow[];
};

function MemberShipTable({ data }: MemberShipTableProps) {
  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={data}
        filterColumn="email"
        filterPlaceholder="Filter members by email..."
      />
    </div>
  );
}

export default MemberShipTable;

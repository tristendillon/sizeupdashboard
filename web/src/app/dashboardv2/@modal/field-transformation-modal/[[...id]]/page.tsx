export default async function FieldTransformationModal({
  params,
}: PageProps<"/dashboardv2/field-transformation-modal/[[...id]]">) {
  const { id } = await params;

  if (!id) {
    return <div>New Field Transformation Modal</div>;
  }
  return <div>Edit Field Transformation Modal</div>;
}

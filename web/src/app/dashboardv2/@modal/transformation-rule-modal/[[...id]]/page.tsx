export default async function TransformationRuleModal({
  params,
}: PageProps<"/dashboardv2/transformation-rule-modal/[[...id]]">) {
  const { id } = await params;

  if (!id) {
    return <div>New Transformation Rule Modal</div>;
  }
  return <div>Edit Transformation Rule Modal</div>;
}

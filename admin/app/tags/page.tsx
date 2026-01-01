import NameCrud from "../_components/NameCrud";

export default function TagsPage() {
  return (
    <NameCrud
      title="Tags"
      apiPath="/tags"
      addLabel="Tag hinzufügen"
      inputPlaceholder="z.B. chill"
    />
  );
}

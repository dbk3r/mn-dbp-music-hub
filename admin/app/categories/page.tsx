import NameCrud from "../_components/NameCrud";

export default function CategoriesPage() {
  return (
    <NameCrud
      title="Kategorien"
      apiPath="/categories"
      addLabel="Kategorie hinzufügen"
      inputPlaceholder="z.B. Ambient"
    />
  );
}

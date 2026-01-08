import { MigrationInterface, QueryRunner } from "typeorm"

export class AddLicenseTemplate1736354000000 implements MigrationInterface {
  name = "AddLicenseTemplate1736354000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "license_template" (
        "id" SERIAL PRIMARY KEY,
        "template_html" TEXT NOT NULL DEFAULT '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { max-width: 200px; margin-bottom: 20px; }
    .content { line-height: 1.6; }
    .field { margin: 10px 0; }
    .label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    {{LOGO}}
    <h1>Audio-Lizenz</h1>
  </div>
  <div class="content">
    <div class="field"><span class="label">Name:</span> {firstname} {lastname}</div>
    <div class="field"><span class="label">Adresse:</span> {street} {housenumber}, {zip} {city}</div>
    <div class="field"><span class="label">E-Mail:</span> {email}</div>
    <div class="field"><span class="label">Audio-Titel:</span> {audio_title}</div>
    <div class="field"><span class="label">Lizenzmodell:</span> {license_model}</div>
    <div class="field"><span class="label">Lizenzbeschreibung:</span> {license_description}</div>
    <div class="field"><span class="label">Bestellnummer:</span> {order_id}</div>
    <div class="field"><span class="label">Kaufdatum:</span> {purchase_date}</div>
  </div>
</body>
</html>',
        "logo_filename" VARCHAR,
        "logo_position" VARCHAR NOT NULL DEFAULT 'top-left',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `)

    // Insert default template
    await queryRunner.query(`
      INSERT INTO "license_template" ("template_html", "is_active") 
      VALUES (DEFAULT, true)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "license_template"`)
  }
}

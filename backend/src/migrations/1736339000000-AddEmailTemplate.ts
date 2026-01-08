import { MigrationInterface, QueryRunner } from "typeorm"

export class AddEmailTemplate1736339000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS email_template (
        id SERIAL PRIMARY KEY,
        template_name VARCHAR(100) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body_html TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Insert default template
    await queryRunner.query(`
      INSERT INTO email_template (template_name, subject, body_html, is_active)
      VALUES (
        'order_confirmation',
        'Bestellbestätigung - Bestellung {order_id}',
        '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0a84ff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .license { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #0a84ff; }
    .download-link { display: block; margin: 5px 0; color: #0a84ff; text-decoration: none; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Vielen Dank für Ihre Bestellung!</h1>
    </div>
    
    <div class="content">
      <p>Hallo {firstname} {lastname},</p>
      
      <p>Ihre Bestellung wurde erfolgreich bezahlt und steht jetzt zum Download bereit.</p>
      
      <div class="license">
        <strong>Bestellnummer:</strong> {order_id}<br>
        <strong>Lizenz-Nummer:</strong> {license_number}<br>
        <strong>Kaufdatum:</strong> {purchase_date}
      </div>
      
      <h3>Ihre Downloads:</h3>
      {downloads}
      
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
    </div>
    
    <div class="footer">
      <p>Diese E-Mail wurde automatisch generiert.</p>
    </div>
  </div>
</body>
</html>',
        true
      )
      ON CONFLICT DO NOTHING
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS email_template`)
  }
}

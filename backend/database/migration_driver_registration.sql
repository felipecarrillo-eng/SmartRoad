-- Ejecutar solo en bases creadas antes de la funcionalidad de registro de conductores.
ALTER TABLE usuarios
  ADD COLUMN documento VARCHAR(30);
ALTER TABLE usuarios
  ADD COLUMN licencia VARCHAR(30);
ALTER TABLE usuarios
  ADD COLUMN telefono VARCHAR(30);
ALTER TABLE usuarios
  ADD COLUMN empresa VARCHAR(120);
ALTER TABLE usuarios
  ADD COLUMN verificacion_estado ENUM('PENDIENTE','VERIFICADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE';

ALTER TABLE conductores
  ADD COLUMN usuario_id INT UNIQUE;
ALTER TABLE conductores
  ADD COLUMN verificacion_estado ENUM('PENDIENTE','VERIFICADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE';
ALTER TABLE conductores
  ADD COLUMN placa VARCHAR(20);
ALTER TABLE conductores
  ADD COLUMN tipo_vehiculo VARCHAR(80);
ALTER TABLE conductores
  ADD COLUMN modelo_vehiculo INT;
ALTER TABLE conductores
  ADD COLUMN tipo_sangre VARCHAR(5);

ALTER TABLE eventos
  ADD COLUMN conductor_id INT;

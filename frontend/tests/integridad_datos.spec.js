const { test, expect } = require('@playwright/test');

test('Validación: impedir registro de producto con precio negativo', async ({ page }) => {
  // 1. ENTRAR A LA LANDING PAGE
  await page.goto('http://localhost:5173/'); 
  
  // 2. NAVEGAR AL SISTEMA ERP (Clic en el botón amarillo)
  // Busca la palabra 'ERP' y hace clic para ir al Login
  await page.getByRole('link', { name: /erp/i }).click(); 
  // Nota: Si es un <button> en tu código de React en vez de un <a>, cambia 'link' por 'button'

  // 3. INICIAR SESIÓN (Ahora sí estamos en la pantalla correcta)
  await page.locator('input[type="text"]').fill('admin'); 
  
  await page.locator('input[type="password"]').fill('admin1234'); 
  
  await page.getByRole('button', { name: /ingresar/i }).click();

  await page.waitForURL('**/erp**');

  // 4. IR AL CATÁLOGO DE PRODUCTOS
  await page.goto('http://localhost:5173/erp/productos'); 

  // 5. ABRIR EL MODAL DE NUEVO PRODUCTO
  await page.getByRole('button', { name: /\+ Nuevo Item/i }).click();

  // 6. LLENAR FORMULARIO CON DATOS INVÁLIDOS
  await page.getByPlaceholder('Ej: BOM-001').fill('TEST-999'); 
  await page.locator('input[type="number"]').fill('-50.00'); 
  
  // 7. INTENTAR GUARDAR
  await page.getByRole('button', { name: /Registrar Producto/i }).click();

  // 8. LA VERDADERA PRUEBA (ASERCIÓN)
  // Le decimos al robot: "Verifica que el precio negativo siga en la pantalla 
  // porque el sistema NO debió dejarte guardar ni cerrar la ventana".
  const inputPrecio = page.locator('input[type="number"]');
  await expect(inputPrecio).toHaveValue('-50.00');
  
  // Pausa final solo para que tú lo veas
  await page.waitForTimeout(2000);
});
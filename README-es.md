# dsh-site-log-check — Continuidad del registro diario de supervisión de obra y cobertura de los registros de supervisión en sitio

`dsh-site-log-check` lee el archivo de supervisión de una obra —el periodo de servicio de supervisión, los registros diarios de supervisión, la lista declarada de partes y procesos clave que requieren supervisión en sitio y los propios registros de supervisión en sitio— y lo contrasta con las cláusulas que cita su paquete de reglas: si un mismo día natural lleva más de un registro o un registro con fecha fuera del periodo de servicio, qué días del periodo no tienen registro, si cada registro rellena sus columnas y nombra a quien lo redactó, si existe la lista declarada de partes y procesos clave y cada uno de ellos tiene su registro de supervisión en sitio, si el registro de supervisión en sitio lleva hora de inicio y de fin en orden, la parte y el proceso clave, la empresa constructora, lo que se encontró y las firmas, y si la supervisión en sitio declarada en un registro diario tiene un registro en la misma fecha. Todo lo que informa son diferencias literales, cada una con la cláusula de la que procede, para que las revise una persona.

## Qué responde

| Usted pregunta | Qué responde |
|---|---|
| Dos registros diarios llevan la misma fecha natural, ¿se informa de ello? | Sí. `SL-001` aplica `params.maxPerDay` (1) y señala cada día natural con más de un registro; también señala el registro cuya fecha queda fuera del periodo de servicio tomado de `project.serviceStart` y `project.serviceEnd`. Compara fechas y recuentos; no decide cuál de los dos asientos es el del día ni si un asiento añadido después estaba justificado. Si no se puede leer ninguna fecha del material, la regla informa de que no pudo ejecutarse en lugar de pasar en silencio. |
| Faltan tres días de registro en medio del periodo de servicio. ¿Qué hace la comprobación? | `SL-002` cuenta los días naturales entre `project.serviceStart` y `project.serviceEnd` que no tienen registro. Es la única regla `info` del paquete: la exigencia de que las fechas sean consecutivas figura en la norma provincial de Fujian DBJT 13-144-2019, no en GB/T 50319-2013, así que avisa y nunca bloquea. Por debajo de `params.minCoverageRatio` (0.9) enumera cada día que falta como diferencia; en ese valor o por encima informa de que no pudo ejecutarse y nombra allí los días que faltan. Si el hueco fue una parada, un festivo o un registro no archivado lo decide una persona. |
| El registro de un día deja vacía la columna de problemas. | `SL-006` señala ese asiento: todo registro diario debe rellenar la columna de los problemas del día y de cómo se resolvieron. Comprueba que la columna esté rellena, no que el texto sea correcto, así que una anotación que diga que no se encontró nada pasa y una celda vacía no. El paquete deja constancia de que las dos lecturas disponibles del 第7.2.2条第4款 difieren en la redacción y de que el escaneo oficial no se pudo releer, por lo que la regla se abstiene a propósito de valorar la redacción y mira solo si la columna está rellena. |
| Nada en el material declara qué partes y procesos clave requieren supervisión en sitio. ¿Pasa en silencio? | No. Cuando el material muestra que hubo supervisión en sitio —existe un registro de supervisión en sitio, o la columna de trabajo de supervisión de algún registro diario menciona 旁站—, `SL-008` informa de que falta la lista declarada. Cuando nada apunta a que haya supervisión en sitio, la regla informa de que no pudo ejecutarse con ese motivo, en lugar de inventar una exigencia que quizá no corresponda a la obra. El paquete anota que el texto de GB/T 50319-2013 no enumera esas partes y procesos, y que la lista procede del 建市〔2002〕189号第二条. |
| Nuestro registro de supervisión en sitio solo está firmado por el supervisor. ¿Se informa? | Sí. Con `params.requireContractorSignature` activado, `SL-011` señala tanto la falta de firma del 旁站监理人员 como la del 施工企业现场质检人员. El paquete separa a propósito las dos bases: la 表 A.0.6 solo tiene la casilla 旁站监理人员（签字）, y la segunda firma procede del 建市〔2002〕189号第七条, así que no debe atribuirse a GB/T 50319-2013. La regla comprueba que las firmas estén consignadas, no que sean auténticas. |
| Un registro diario dice que el 12 de mayo hubo supervisión en sitio, pero ese día el libro de registros no tiene nada. | `SL-013` lo señala: coteja las fechas de los registros diarios cuya columna de supervisión menciona 旁站 con las fechas de inicio de los registros de supervisión en sitio. Solo comprueba que ambas cosas cuadren; el paquete afirma que ni GB/T 50319-2013 ni 建市〔2002〕189号 exigen que los dos documentos se enlacen por número. Si ningún registro de supervisión en sitio tiene hora de inicio, o ningún registro diario declara supervisión en sitio, la regla informa de que no pudo ejecutarse en lugar de pasar en silencio. |

## Normas que sigue

| Documento | Número | Reglas que lo citan |
|---|---|---|
| 《建设工程监理规范》 | GB/T 50319-2013 | SL-001, SL-002, SL-003, SL-004, SL-005, SL-006, SL-007, SL-008, SL-009, SL-010, SL-011, SL-013, SL-014 |
| 福建省《建设工程监理文件资料管理标准》 | DBJT 13-144-2019 | SL-002 |
| 《建设工程质量管理条例》 | 国务院令第279号 | SL-008 |
| 《房屋建筑工程施工旁站监理管理办法（试行）》 | 建市〔2002〕189号 | SL-011, SL-012 |

**Boundary:** this plugin checks the **continuity of the daily supervision log and the coverage of
on-site supervision records** for a construction project — the site-supervision domain (工程监理).
It is not `dsh-archive-check` (which checks whether project records are complete for archiving), not
`dsh-hazplan-check` (which checks the sections of a plan for a hazardous sub-project), and not a
site-safety inspector. It reads a machine-readable export of the supervision office's own records and
reports literal mismatches against cited clauses.

## Compatibility

| Superficie | Estado |
|---|---|
| Harness | Rango de peers `>=0.1.2-rc.1 <0.2.0 \|\| >=0.2.0-0 <0.3.0` — verificado para aceptar tanto `0.2.0-rc.2` como `0.2.1-alpha.1`. **No se declara `engines.dsh`**: no tiene lector y no puede rechazar ningún host |
| Node | `^22.19.0 || >=24.0.0` |
| Plataformas | Todas (ESM puro; sin código nativo, sin red, sin llamada al modelo) |
| Modo de herramienta | Funciona en `native`, `ptc` y `both`; para un directorio completo use `ptc` |

## What it does

La tabla de reglas, los campos y el comportamiento detallado están en [README.md](README.md#what-it-does) (versión principal en inglés). El plugin sólo enumera divergencias literales frente a las cláusulas citadas e indica en `skipped` cada comprobación que no pudo ejecutarse.

## Install

```sh
dsh plugin --profile <name> add dsh-site-log-check
dsh --profile <name> --dump-config | grep 'dsh-site-log-check'
```

## Configuration

Todos los parámetros ajustables viven en el esquema Schemastery de `src/config.ts`, por lo que se cambian desde `cordis.yml` sin tocar el código; los umbrales por regla están en el paquete de reglas bajo `rules/`.

| Clave | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `rulesFile` | string | `rules/site-log-check.yaml` | Ruta del paquete de reglas, relativa a la raíz del paquete |
| `disabledRules` | string[] | `[]` | Ids de reglas que se dejan de ejecutar; cada una aparece en `skipped` |
| `onlyRules` | string[] | `[]` | Ejecutar solo estas reglas; vacío ejecuta todas |
| `skipNotes` | string | `""` | Nota añadida a cada motivo de `skipped` |
| `timeoutMs` | number | `120000` | Presupuesto de tiempo de espera cooperativo de la herramienta |

## Material format

Acepta JSON o YAML. El ejemplo completo de campos está en [README.md](README.md#material-format) (versión principal en inglés). Los campos son opcionales en la capa de lectura y los valida el motor, de modo que una exportación parcial produce hallazgos sobre lo que falta en lugar de un fallo.

## Rule sources

Los datos de las reglas están separados del código: cada regla lleva documento, número, cláusula en la numeración propia de la fuente, extracto literal y URL de origen. El cargador impone que el extracto sea una cita real de al menos ocho caracteres y que una comprobación basada sólo en un principio general (`kind: derived-from-principle`, tope `warn`) o en una política local (`kind: institutional-configuration`, tope `info`) nunca se declare `error`.

Los límites verificados y las conclusiones deliberadamente **no** afirmadas están en [README.md](README.md#rule-sources) (versión principal en inglés) y en `rules/evidence/`.

## Troubleshooting

- **El plugin se instala pero la herramienta no aparece**: compruebe que `main` resuelve a `lib/index.mjs` y que `pnpm run build` lo generó.
- **`dsh plugin add` rechaza el paquete**: la faixa de peers cubre `0.1.x` y `0.2.x`; fuera de ella, conceda una exención explícita con `dsh plugin --profile <name> allow-version <pkg@ver> --dsh-version <runtime> --accept-risk`.
- **Una regla no se ejecutó**: lea el arreglo `skipped`.
- **`check` informa `manifest-peers` como fallo**: es un problema conocido de `dsh-plugin-dev`; el runtime aplica la compatibilidad al instalar.
- **Los horarios parecen desplazados**: toda la aritmética es de hora local sobre las cadenas entregadas.

## Development

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
node ../scripts/sync-shared.mjs dsh-site-log-check
```

El último comando copia el kit compartido de `../_shared` a `src/shared/`; vuelva a ejecutarlo tras cada cambio compartido.

## License

[Apache License 2.0](LICENSE) © 2026 dsh-site-log-check contributors.

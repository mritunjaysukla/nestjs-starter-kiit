import { writeFileSync, mkdirSync, existsSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const name = process.argv[2];
if (!name) {
  console.error('❌ Please provide a resource name: yarn gen resource <name>');
  process.exit(1);
}

const pascal = name.charAt(0).toUpperCase() + name.slice(1);
const kebab = name.toLowerCase();
const baseDir = join(__dirname, `../src/modules/${kebab}`);

if (existsSync(baseDir)) {
  console.error(`❌ Module "${kebab}" already exists.`);
  process.exit(1);
}

mkdirSync(baseDir, { recursive: true });
mkdirSync(join(baseDir, 'dto'));
mkdirSync(join(baseDir, 'entities'));

rl.question(`Generate entity for "${kebab}"? (y/n): `, (answer) => {
  const generateEntity = answer.toLowerCase().startsWith('y');

  const files = {
    [`${kebab}.controller.ts`]: `
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('${kebab}')
@Controller('${kebab}')
export class ${pascal}Controller {}
`.trim(),

    [`${kebab}.service.ts`]: `
import { Injectable } from '@nestjs/common';

@Injectable()
export class ${pascal}Service {}
`.trim(),

    [`${kebab}.module.ts`]: `
import { Module } from '@nestjs/common';
import { ${pascal}Controller } from './${kebab}.controller';
import { ${pascal}Service } from './${kebab}.service';

@Module({
  controllers: [${pascal}Controller],
  providers: [${pascal}Service],
})
export class ${pascal}Module {}
`.trim(),

    [`dto/create-${kebab}.dto.ts`]: `
import { ApiProperty } from '@nestjs/swagger';

export class Create${pascal}Dto {
  @ApiProperty()
  exampleField: string;
}
`.trim(),

    [`dto/update-${kebab}.dto.ts`]: `
import { PartialType } from '@nestjs/mapped-types';
import { Create${pascal}Dto } from './create-${kebab}.dto';

export class Update${pascal}Dto extends PartialType(Create${pascal}Dto) {}
`.trim(),

    ...(generateEntity && {
      [`entities/${kebab}.entity.ts`]: `
import { ApiProperty } from '@nestjs/swagger';

export class ${pascal} {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}
`.trim(),
    }),
  };

  for (const [file, content] of Object.entries(files)) {
    writeFileSync(join(baseDir, file), content);
  }

  // Auto-import module into app.module.ts
  const appModulePath = join(__dirname, '../src/app.module.ts');
  if (existsSync(appModulePath)) {
    const appModuleContent = readFileSync(appModulePath, 'utf8');

    const importLine = `import { ${pascal}Module } from './modules/${kebab}/${kebab}.module';`;

    if (!appModuleContent.includes(importLine)) {
      const updated = appModuleContent.replace(
        /(@Module\(\{\s*imports:\s*\[)([^]*?)(\]\s*\}\))/, // Match imports array
        (_, prefix, middle, suffix) => {
          const newImportArray = `${middle.trimEnd()},\n    ${pascal}Module`;
          return `${prefix}${newImportArray}${suffix}`;
        }
      );

      const finalOutput = `${importLine}\n${updated}`;
      writeFileSync(appModulePath, finalOutput);
      console.log(`✅ Registered ${pascal}Module in app.module.ts`);
    }
  }

  console.log(`✅ Resource "${kebab}" generated successfully.`);
  rl.close();
});

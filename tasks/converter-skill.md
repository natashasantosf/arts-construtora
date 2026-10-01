# Website converter skill task

O objetivo dessa tarefa é criar uma Claude Skill para converter sites antigos para o nosso template astro.

## Por que?

Por que uma vez que o site antigo estiver no formato do nosso template, nós teremos a segurança de que o nosso repositório tem a disciplina necessária para ser a base do nosso projeto, e dessa forma nós conseguiremos evoluir o site com a stack tecnológica apropriada.

Uma vez em nosso template, nós teremos um site fundado a partir de um design system, e será mais fácil fazer alterações globais consistentes (e até mesmo modificar completamente o design do site).

## Input

O site baixado está na pasta inputs/site-download. Em geral os arquivos lá contidos serão arquivos html, e as rotas são file-based. Em geral será possível abrir o arquivo html no navegador e ver exatamente como o site se comporta. Entretanto, pode ser que haja informação incompleta, e essa skill fará os melhores esforços o possível para entregar um novo site que segue a filosofia e a tecnologia do nosso template (Design System + Astro + Tailwind + Cloudflare).

## Objetivo

O objetivo dessa skill é converter o site baixado em inputs/site-download para o nosso formato de site astro no repo principal. 

O código existente é boilerplate e não precisa ser respeitado.

O objetivo não é melhorar o site ou gerar conteúdo. Se atenha à conversão.

Mas caso necessite, há liberdade para fazer adaptações de design.

## Output

O site final deverá ser visualmente semelhante ao site do input.

No entanto, ele deverá ser construído segundo a arquitetura do template. Logo, a IA deverá ajustar:

- Arquitetura da Informação (content.config.ts)
- Design system
- Componentes
- Metadados (SEO técnico)
- entre outros

O site precisa ser semelhante, mas não necessariamente igual. Ajustes são permitidos, mas não incentivados. Por conta disso o rigor da elaboração e aplicação do design system é tão importante.

Ao fim, verifique se o resultado ficou parecido.

## Outros recursos

É fundamental ter acesso ao MCP do astro para tirar dúvidas sobre a documentação e aplicar as técnicas mais modernas.

É interessante ententer como elaborar uma skill. O claude tem uma skill chamada skill-creator, e há outras boas práticas para criação de skills. Ouvi notícias sobre uma skill para pesquisar skills ([https://agenticskills.io/skills/find-skills](https://agenticskills.io/skills/find-skills)) mas não sei se isso é overkill.

No fim das contas, será possível generalizar esse trabalho e apenas chamar uma skill de “converter site” e teremos um site antigo migrado para a nossa estrutura template.
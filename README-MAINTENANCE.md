# Manutenção do Código do Projeto Galeguia

## Estrutura de Pastas e Redundância

Este projeto mantém três diretórios com conteúdo similar por motivos históricos e de compatibilidade:

- `web-admin/` - Código-fonte principal (faça alterações aqui)
- `docs/` - Usado para GitHub Pages
- `public/` - Usado para outras plataformas de hospedagem

## Como Fazer Manutenção

Para evitar inconsistências:

1. **Sempre faça alterações apenas no diretório `web-admin/`**
2. Execute `npm run sync` após as alterações para sincronizar o conteúdo com as outras pastas
3. Verifique se as alterações foram aplicadas corretamente em todos os diretórios

## Não modifique diretamente as pastas 'docs' ou 'public'

Essas pastas são geradas automaticamente a partir de `web-admin/`. Modificações diretas serão sobrescritas quando você executar o comando de sincronização.

## Implantação

O comando `npm run deploy` irá sincronizar as pastas antes da implantação.

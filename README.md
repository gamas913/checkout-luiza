# Checkout Diário – Luiza (PWA v1)

## O que esta versão faz
- Salva checkouts no próprio aparelho.
- Mantém uma lista de nomes de projetos já usados.
- Salva rascunho automaticamente enquanto o formulário é preenchido.
- Exporta e restaura backup completo em JSON.
- Funciona offline após a primeira abertura.
- Pode ser instalada como aplicativo no celular ou computador.

## Como publicar no GitHub Pages
1. Crie um repositório novo no GitHub.
2. Envie **todo o conteúdo desta pasta**, mantendo as pastas `assets/css`, `assets/js` e `assets/icons`.
3. No repositório, abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`, depois salve.
6. O GitHub mostrará o endereço público do aplicativo.

## Importante
O GitHub hospeda o aplicativo, mas não guarda os checkouts. Os dados continuam no navegador de cada aparelho. Use “Baixar backup completo” regularmente. Sincronização automática entre aparelhos exige uma etapa futura com banco de dados e login, como Supabase ou Firebase.

# Voz de cada estudante

Adapte a escrita ao autor atual ao redigir ou revisar uma atividade. Esta referência substitui o antigo modelo fixo de autoavaliação. É parte da skill Moodle, não uma skill externa de redação.

## Identificar o autor

Use um alias local estável para o estudante atual. Na instalação pessoal com uma única conta, pode usar `principal`. Se houver vários estudantes no mesmo computador, escolha aliases distintos e confirme quem está ativo antes de carregar o perfil. Não use nome completo, matrícula, e-mail ou senha como alias.

O helper `scripts/voice-profile.cjs`, relativo a esta skill, mantém um perfil em `~/.moodle-playwright/estudantes/<alias>/escrita.json`. Codex e Claude podem usar esse mesmo perfil local. Não enviar esses arquivos para o GitHub.

## Aprender com os prompts

1. No início de uma tarefa de texto, leia o perfil do estudante. Se ainda não existir, observe os prompts da conversa atual e comece com adaptações pequenas, de baixa confiança.
2. Use os prompts como indícios de registro, objetividade e preferência de vocabulário. Eles não demonstram, sozinhos, como o estudante escreve um relatório ou uma narrativa. Não copiar erros de digitação nem transformar abreviações de chat em regra para trabalhos.
3. Trate pedidos explícitos como “mais curto”, “menos formal” ou “não conclua repetindo tudo” como preferências fortes. Textos do próprio estudante e versões que ele aprovou têm mais peso que uma inferência a partir de um prompt.
4. Atualize o resumo de estilo quando surgir uma preferência nova ou uma correção relevante. Não grave toda mensagem nem atualize só para mudar a data. Antes de salvar, confira se o perfil corresponde ao autor atual.
5. Em caso de conflito, siga primeiro o enunciado e as regras da atividade, depois a instrução atual do estudante, depois preferências explícitas anteriores e, por último, inferências dos prompts. Informe uma tensão concreta quando ela afetar o resultado.

Guarde apenas características de escrita: idioma, tom, extensão, vocabulário, ritmo, organização, intensidade emocional e preferências explícitas. Não grave prompts completos, exemplos pessoais, nomes, experiências íntimas, assuntos de saúde, crenças, dados financeiros ou credenciais. Não inferir identidade, personalidade ou capacidade acadêmica pelo jeito de digitar.

## Aplicar sem virar fórmula

- Varie extensão de frases e parágrafos de acordo com a voz observada. Evite forçar introdução, três argumentos e uma conclusão em todo texto.
- Em reflexões e narrativas, pode partir de uma lembrança e voltar ao ponto principal quando isso combinar com o pedido e com o autor. Organização não linear deve continuar compreensível e responder ao enunciado.
- Emoção vem do que o aluno relatou. Não invente sentimentos, acontecimentos ou opiniões pessoais para parecer mais humano.
- Preserve precisão em respostas técnicas, cálculos e referências. A voz do autor não autoriza alterar fatos ou deixar de cumprir a rubrica.
- Ao revisar um rascunho, preserve escolhas deliberadas do autor. Não torne todo estudante parecido com o criador deste repositório.

## Memória local

Execute com Node.js e o caminho real do helper instalado:

```text
node <pasta-da-skill>/scripts/voice-profile.cjs read --student principal
```

Para atualizar, envie pelo stdin um JSON com apenas as preferências observadas:

```json
{
  "tone": "natural e direto",
  "length": "preferir respostas curtas quando o enunciado permitir",
  "rhythm": "alternar frases curtas e médias sem cadência fixa",
  "confidence": "low",
  "explicitPreferences": ["evitar linguagem rebuscada"]
}
```

Use `update --student <alias>` e passe esse JSON por stdin. Os valores acima são um exemplo, não um perfil padrão. Em correções futuras, atualize apenas os campos que mudaram. Há também `read`, `list` e `forget --student <alias>` para o titular consultar ou apagar a memória.

Se o cliente não puder gravar arquivos ou executar o helper, adapte-se dentro da conversa e diga que o perfil não foi persistido. Não afirmar que houve treinamento do modelo ou aprendizado permanente fora desses arquivos.

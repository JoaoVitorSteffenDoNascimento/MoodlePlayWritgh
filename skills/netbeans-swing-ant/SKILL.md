---
name: netbeans-swing-ant
description: Criar e corrigir exercícios acadêmicos em Java Swing para o NetBeans com Apache Ant, seguindo enunciados e imagens, com JFrame Form editável, máscaras de entrada e entrega em ZIP. Use para projetos Java with Ant, arquivos .form, GUI Builder/Design e correções nesses exercícios; não para sites, JavaFX, Maven ou Gradle escolhidos pelo usuário.
---

# NetBeans Swing com Ant

Entregar o exercício pedido, executável e editável no NetBeans, respeitando a aparência do modelo e as alterações da pessoa usuária. Não transformar um exercício simples em um produto com recursos adicionais.

## Enunciado e preferências do usuário

- Ler o PDF inteiro e inspecionar as páginas com imagens: extrair texto não revela a disposição da tela.
- Identificar nomes obrigatórios, classes, campos, menus, botões, cálculos, limites e mensagens antes de implementar. Usar esses requisitos como critério de conclusão.
- Seguir o modelo visual: posições, agrupamentos, tabela, opções de sexo e botões. Acrescentar à imagem somente campos e funções que o texto exige. Não redesenhar a interface em estilo moderno nem adicionar botão Limpar, ordenação, persistência ou banco sem necessidade do pedido.
- Quando o enunciado exigir nome de aluno em classes, arquivos ou projeto, usar o nome informado pelo titular. Se faltar, perguntar antes de fixar os identificadores. Não inferir o nome pelo usuário do sistema operacional nem reutilizar o nome de quem compartilhou esta skill.
- Entregar exercícios sem comentários explicativos por padrão, sem a pessoa usuária precisar pedir. Preservar as marcações técnicas `GEN-*`, `editor-fold` e declaração de variáveis geradas pelo NetBeans: a pessoa usuária autorizou essas marcações para manter a edição visual no Design. Não interpretar “sem comentários” como autorização para remover essas marcações.
- Se houver botão Imprimir, implementar o comportamento exigido pelo enunciado ou solicitado pelo usuário; não presumir impressão real nem uma simulação universal.

## Projeto e formulário

- Criar um projeto **Java with Ant / Java Application**, com `build.xml`, `nbproject`, `src`, manifesto e classe principal configurada. Não substituir por Maven/Gradle.
- O JFrame precisa ter `.java` e `.form` com o mesmo nome, no mesmo pacote e diretório. O arquivo `.form` deve descrever todos os componentes da tela, seus modelos, propriedades, layout e eventos; não entregar só código ou um painel vazio no Design.
- Usar o layout livre nativo do GUI Builder: `GroupLayout` no Java e `Layout/DimensionLayout` no `.form`. Conferir a estrutura de um formulário nativo da pessoa usuária, quando disponível. Não depender de arquivos pessoais da máquina de origem; usar a referência portátil incluída nesta skill.
- Todo componente do formulário, inclusive um painel aninhado, deve constar nos dois eixos do `GroupLayout` Java e nas duas `DimensionLayout` do `.form`. Um componente omitido do eixo vertical ou horizontal só falha no `pack()` com `is not attached to a ... group`; corrigir e executar antes de entregar.
- Antes de criar ou reparar os arquivos, ler [references/formulario-nativo.md](references/formulario-nativo.md). Guardar as marcações dos blocos gerados; registrar eventos no `.form` e implementar seus métodos no `.java`.
- Manter regras e validações fora dos blocos gerados. Métodos auxiliares personalizados não devem depender de componentes removidos ou de variáveis cujo nome foi alterado no Design.
- Usar o JDK solicitado ou compatível com a plataforma do projeto da pessoa usuária. Não fixar Java 8 por hábito quando a instalação usa outro JDK. Separar avisos de compilação de erros; confirmar o resultado de Ant.
- Se Ant não estiver no PATH, procurar a distribuição incluída no NetBeans. Localizar o executável no sistema atual, sem assumir um caminho fixo de Linux ou Windows. Para gerar a estrutura padrão de Ant, preferir templates instalados do NetBeans, inclusive `build.xsl` e `build-impl.xsl` do módulo j2seproject, em vez de improvisar um build incompatível com a IDE.

## Campos e lógica

- Configurar máscaras de data e CEP com `JFormattedTextField` e `MaskFormatter`, tanto no Java como na propriedade `formatterFactory` do `.form`. A pessoa usuária deve digitar os números e receber a pontuação automaticamente.
- Para telefone com DDD, aceitar os tamanhos previstos no exercício. Se forem aceitos fixo e celular, não impor uma máscara que bloqueie um deles. Validar digitação, colagem, substituição e exclusão.
- Máscara não valida calendário. Validar datas reais, anos bissextos e datas futuras; calcular idade em anos completos e atualizar idade/mês quando a data for completada, sem exigir clique adicional. Limpar resultados quando a data ficar incompleta ou inválida.
- Calcular com o valor completo e arredondar apenas a exibição. Em números decimais, aceitar vírgula e ponto quando apropriado. Tratar entrada vazia, inválida e divisão por zero com mensagens em português e try-catch.
- Usar as fórmulas e classificações do enunciado, sem trocar a tabela por outra referência. Se os limites se sobrepuserem, escolher uma convenção consistente e explicá-la apenas onde necessário.
- Gravar inclui o item na JTable conforme o pedido; remover usa a linha selecionada. Não apresentar gravação em memória como persistência em disco.

## Correções e verificação

- Trabalhar no projeto que a pessoa usuária está efetivamente abrindo. Em um log `ant -f`, o caminho identifica essa cópia; não corrigir só outra pasta ou um ZIP antigo.
- Preservar exclusões, mudanças de layout e renomeações feitas pela pessoa usuária. Após apagar um controle no Design, procurar referências restantes fora do código gerado, inclusive atalhos, listeners e validações. Não restaurar um controle retirado deliberadamente.
- Compilar com Ant e gerar o JAR após mudanças relevantes. Testar os cálculos e os fluxos alterados sem exigir bibliotecas externas desnecessárias.
- Validar máscaras pelo documento Swing, incluindo números sem pontuação, colagem, edição e atualização automática dos resultados. Conferir que `.java` e `.form` continuam coerentes.
- Quando houver ambiente gráfico, abrir o projeto, o Design e o programa no NetBeans. Se ele estiver indisponível, verificar o que for possível e informar o limite. Renderização em painel Swing sem janela e testes com adaptação de JFrame para JPanel não comprovam abertura da aba Design nem execução da janela original.
- Não declarar que a janela foi executada se o ambiente não tiver acesso funcional ao servidor gráfico; diferenciar esse limite da compilação e dos testes de cálculo.
- Não declarar o formulário testado no GUI Builder apenas porque o XML foi analisado ou a compilação passou.
- Em formulários com `JScrollPane`, seguir a serialização nativa: não inventar classes de layout como `org.netbeans.modules.form.compat2.layouts.support.JScrollPaneSupportLayout`, que não existem. A compilação Java não valida esses nomes no `.form`. Ao corrigir Design não editável, validar também o carregamento, a ausência de erros de persistência e uma alteração seguida de salvamento no editor, quando o ambiente permitir.

## Entrega e comentários

- Entregar um ZIP com uma única pasta de projeto, nomeada conforme o enunciado, contendo fontes, `.form` e metadados Ant/NetBeans. Excluir `nbproject/private`, arquivos temporários, caches e capturas pessoais. Incluir apenas documentação e testes que ajudem a entrega; não acumular artefatos de desenvolvimento.
- Gerar o ZIP a partir da versão atual após as últimas alterações. Conferir integridade, arquivos necessários e ausência de nomes absolutos da máquina na configuração compartilhada.
- Por padrão, retirar comentários explicativos e preservar as marcações `GEN-*` e `editor-fold` necessárias ao editor visual. Explicar essa distinção se a pessoa usuária perguntar.
- Se a pessoa usuária pedir **todos** os comentários e marcações removidos, respeitar o pedido: preservar uma cópia editável e entregar um ZIP separado sem comentários, incluindo os de arquivos Java, XML/Ant e propriedades. Explicar brevemente que a remoção de `GEN-*` pode afetar o Design. Não prometer simultaneamente ausência dessas marcações e funcionamento garantido do GUI Builder.
- Não remover comentários Java com regex indiscriminada: preservar literais de texto, caracteres e escapes. Recompilar a cópia limpa antes de compactar.
- Ao finalizar, dar o link do ZIP e instruções curtas de abertura: Arquivo > Abrir Projeto > pasta extraída; Pacotes de Código-fonte > pacote > JFrame > Design; F6 para executar.
- A pasta `NetBeansProjects` facilita a localização, mas não é requisito técnico. Criar uma cópia ali quando útil e autorizado pelo pedido; informar qual cópia abrir e nunca sobrescrever trabalho diferente da pessoa usuária.

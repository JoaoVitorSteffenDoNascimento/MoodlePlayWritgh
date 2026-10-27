# Estrutura de um JFrame Form nativo

Use ao implementar ou corrigir o Design. Os trechos abaixo descrevem a serialização usada como referência de formulário nativo; adapte nomes, propriedades, tamanhos e layout ao exercício atual.

## Arquivos e layout

O `.java` declara o pacote e a classe que estende `javax.swing.JFrame`. O `.form` é um arquivo separado com o mesmo nome:

```xml
<Form version="1.3" maxVersion="1.9" type="org.netbeans.modules.form.forminfo.JFrameFormInfo">
  <Properties>
    <Property name="defaultCloseOperation" type="int" value="3"/>
  </Properties>
  <SyntheticProperties>
    <SyntheticProperty name="formSizePolicy" type="int" value="1"/>
    <SyntheticProperty name="generateCenter" type="boolean" value="true"/>
  </SyntheticProperties>
  <AuxValues>
    <AuxValue name="FormSettings_layoutCodeTarget" type="java.lang.Integer" value="1"/>
    <AuxValue name="FormSettings_listenerGenerationStyle" type="java.lang.Integer" value="3"/>
    <AuxValue name="FormSettings_variablesLocal" type="java.lang.Boolean" value="false"/>
    <AuxValue name="FormSettings_variablesModifier" type="java.lang.Integer" value="2"/>
  </AuxValues>
  <Layout>
    <DimensionLayout dim="0">
      <Group type="103" groupAlignment="0" attributes="0">
        <Group type="102" alignment="0" attributes="0">
          <EmptySpace min="-2" pref="20" max="-2" attributes="0"/>
          <Component id="btnGravar" min="-2" pref="125" max="-2" attributes="0"/>
          <EmptySpace min="0" pref="20" max="32767" attributes="0"/>
        </Group>
      </Group>
    </DimensionLayout>
    <DimensionLayout dim="1">
      <Group type="103" groupAlignment="0" attributes="0">
        <Group type="102" alignment="0" attributes="0">
          <EmptySpace min="-2" pref="20" max="-2" attributes="0"/>
          <Component id="btnGravar" min="-2" pref="32" max="-2" attributes="0"/>
          <EmptySpace min="0" pref="20" max="32767" attributes="0"/>
        </Group>
      </Group>
    </DimensionLayout>
  </Layout>
  <SubComponents>
    <Component class="javax.swing.JButton" name="btnGravar">
      <Properties>
        <Property name="text" type="java.lang.String" value="Gravar"/>
      </Properties>
      <Events>
        <EventHandler event="actionPerformed" listener="java.awt.event.ActionListener" parameters="java.awt.event.ActionEvent" handler="btnGravarActionPerformed"/>
      </Events>
    </Component>
  </SubComponents>
</Form>
```

Cada componente visual direto do contêiner precisa aparecer nas duas dimensões. Contêineres aninhados têm seu próprio layout e subcomponentes. Os IDs do XML, os campos Java e as referências do GroupLayout precisam coincidir. Não substituir o layout livre por `setLayout(null)` ou `setBounds` quando a tarefa pede a estrutura nativa usada no exemplo.

Em `initComponents`, criar componentes, aplicar propriedades, associar eventos e construir os grupos horizontal/vertical de `javax.swing.GroupLayout`. Preferir grupos de linhas/colunas coerentes com o modelo; grupos sequenciais independentes dentro de um grupo paralelo podem representar posições, mas não dispensam a conferência visual.

## Blocos e eventos

A posição das marcações deve acompanhar a estrutura gerada pelo NetBeans:

```java
@SuppressWarnings("unchecked")
// <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
private void initComponents() {
    btnGravar = new javax.swing.JButton();
    btnGravar.setText("Gravar");
    btnGravar.addActionListener(this::btnGravarActionPerformed);
    // Aqui entra o GroupLayout completo do formulário.
    pack();
}// </editor-fold>//GEN-END:initComponents

private void btnGravarActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnGravarActionPerformed
    gravar();
}//GEN-LAST:event_btnGravarActionPerformed

// Variables declaration - do not modify//GEN-BEGIN:variables
private javax.swing.JButton btnGravar;
// End of variables declaration//GEN-END:variables
```

O comentário de exemplo sobre GroupLayout não pertence ao código final. As marcações técnicas permanecem na versão editável. Toda entrada `EventHandler` precisa apontar para um método existente. Associar cada listener uma única vez; não repetir a associação em `configurarTela` e `initComponents`.

## Máscaras no Design

Para um campo data, usar `javax.swing.JFormattedTextField` no XML e no Java. A propriedade serializada é:

```xml
<Property name="formatterFactory" type="javax.swing.JFormattedTextField$AbstractFormatterFactory" editor="org.netbeans.modules.form.editors.AbstractFormatterFactoryEditor">
  <Format format="##/##/####" subtype="-1" type="5"/>
</Property>
<Property name="focusLostBehavior" type="int" value="3"/>
```

CEP usa `#####-###`. O Java correspondente cria `DefaultFormatterFactory(new MaskFormatter(mascara))` e trata `java.text.ParseException`. `focusLostBehavior=3` corresponde a `JFormattedTextField.PERSIST`; preserva entradas incompletas ao perder foco para validação pela aplicação. Ao checar se o preenchimento da data está completo, contar dígitos, não o comprimento bruto: a máscara já contém barras e espaços.

## Compatibilidade da entrega

Não confundir três verificações: compilação Java/Ant, comportamento dos componentes Swing e abertura do GUI Builder. Os dois primeiros resultados não garantem o terceiro. Quando a usuária reportar problema no Design, inspecionar o projeto que ela está abrindo, o par `.java`/`.form`, as marcações, os métodos de eventos e a coerência do layout antes de repetir instruções genéricas para abrir a aba.

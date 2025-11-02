# 🎥 Lance Certo — Captura Inteligente de Melhores Momentos

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Python](https://img.shields.io/badge/python-3.10%2B-blue)]()
[![OpenCV](https://img.shields.io/badge/OpenCV-4.x-red)]()
[![FFmpeg](https://img.shields.io/badge/FFmpeg-enabled-green)]()

> **Projeto Interdisciplinar de Extensão II — SETREM**  
> Desenvolvido por alunos de Engenharia de Computação com apoio do LARCC

---

## 💭 Motivação

Registrar e compartilhar os melhores momentos de uma partida esportiva ainda é um desafio em ambientes **amadores e comunitários**.  
Os métodos tradicionais exigem gravações longas, edição manual e equipamentos caros — tornando inviável para atletas locais.

O **Lance Certo** surge para **democratizar o acesso à tecnologia de gravação esportiva**, criando uma solução simples, de **baixo custo** e fácil operação.  
Usando apenas **um notebook com webcam** e **um botão de acionamento manual**, o sistema grava continuamente e salva os **últimos minutos da partida** ao toque de um botão — sem necessidade de edição posterior.

---

## ⚙️ Arquitetura e Tecnologias

O projeto consiste em um **protótipo funcional** que une conceitos de **engenharia de sistemas, estruturas de dados e visão computacional**.

### 🧩 Componentes Principais

- 🎞️ **OpenCV** → Captura e manipulação de vídeo em tempo real  
- 🧠 **FFmpeg** → Compressão e codificação em H.264 (MP4)  
- 🔁 **Buffer Circular em RAM** → Armazena continuamente os últimos frames  
- ⚡ **Multi-threading (Produtor-Consumidor)** → Baixa latência e responsividade  
- 💻 **Notebook como plataforma única** → Integração total de hardware e software  

---

## 🧪 Metodologia

O projeto segue uma **abordagem experimental** de pesquisa aplicada, dividida em três fases:

1. **Desenvolvimento do protótipo** → Implementação inicial e testes de hardware/software;  
2. **Testes de usabilidade** → Coleta de feedback com usuários reais em quadras;  
3. **Análise de desempenho** → Avaliação quantitativa (latência, armazenamento e estabilidade).

---

## 🧭 Cronograma

| Etapa | Período | Status |
|-------|----------|--------|
| Planejamento e Revisão Teórica | Jan–Abr/2025 | ✅ Concluído |
| Desenvolvimento do Protótipo | Mai–Out/2025 | 🚧 Em progresso |
| Testes e Validação | Nov–Dez/2025 | ⏳ A iniciar |
| Integração com LARCC e Análise de Dados | 2026 | 🔜 Planejado |

---

## 💰 Orçamento

| Item | Quantidade | Valor (R$) |
|------|-------------|-------------|
| SSD Sandisk 1TB | 1 | 451,05 |
| Notebook Dell Vostro i5 10ª, 16GB RAM | 1 | 3.762,00 |
| **Total Geral** |  | **4.213,05** |

---

## 📘 Documentação

Toda a documentação técnica está disponível em:  
📄 [`/docs/Projeto_Interdisciplinar_II.pdf`](./docs/Projeto_Interdisciplinar_II.pdf)

Acesse para entender:
- Estruturas de dados (buffer circular);
- Pipeline de vídeo (OpenCV + FFmpeg);
- Métodos de coleta e análise de dados;
- Métricas de desempenho e testes de usabilidade.

---

⚠️ Termos de Uso

Este é um projeto experimental e acadêmico, desenvolvido por alunos da Sociedade Educacional Três de Maio (SETREM).
Por favor, não utilize o sistema para fins comerciais ou de captura automatizada em larga escala.

Para uso pessoal, testes e aprendizado, o código está licenciado sob a MIT License.

---

| Nome                 | Função                                    | Instituição |
| -------------------- | ----------------------------------------- | ----------- |
| **Enzo Allebrand**   | Desenvolvimento e Integração de Hardware  | SETREM      |
| **Kauã Patricki**    | Estrutura de Dados e Testes de Desempenho | SETREM      |
| **Leonardo Herkert** | Documentação Técnica e Coordenação        | SETREM      |

---

| Área                     | Ferramentas                |
| ------------------------ | -------------------------- |
| Linguagem                | Python                     |
| Processamento de vídeo   | OpenCV, FFmpeg             |
| Estruturas de dados      | Buffer Circular            |
| Interface                | Tkinter / PyQt (em estudo) |
| Infraestrutura de testes | LARCC (SETREM)             |

---

⭐ Agradecimentos

Este projeto conta com o apoio da SETREM (Sociedade Educacional Três de Maio) e do LARCC (Laboratory of Advanced Research on Cloud Computing), que oferecem infraestrutura e suporte técnico ao desenvolvimento do protótipo.

---

📍 Três de Maio, RS — 2025
🎓 Projeto Interdisciplinar de Extensão II — Engenharia de Computação, SETREM

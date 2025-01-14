import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import axios from 'axios';
import QRCode from 'qrcode-terminal';
import moment from 'moment-timezone';

// Defina o fuso horário
moment.tz.setDefault('America/Sao_Paulo');

// Caminho para o arquivo de auth
const authInfoPath = 'auth_info';

// Estrutura para controlar os testes já criados por número
const testesCriados = {};

// Função para começar o bot
async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState(authInfoPath);
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: true
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async ({ connection, qr }) => {
        if (qr) QRCode.generate(qr, { small: true });
        if (connection === 'open') {
            console.log(`[${moment().format()}] ✅ Bot conectado com sucesso!`);
        }

        if (connection === 'close' || connection === 'conn_fail') {
            console.log(`[${moment().format()}] ⚠️ Conexão perdida. Tentando reconectar...`);
            setTimeout(() => startSock(), 10000);  // Aguardar 10 segundos antes de tentar reconectar
        }
    });

    socket.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (!msg.key.fromMe && msg.message?.conversation) {
                const jid = msg.key.remoteJid;
                const msgContent = msg.message.conversation.trim();

                // Verificar se a opção foi escolhida corretamente
                if (['10', '11', '12', '13', '14', '15', '16'].includes(msgContent)) {
                    await criarTeste(socket, jid, msgContent);
                } else {
                    await mostrarMenu(socket, jid);  // Envia o menu caso não seja uma opção válida
                }
            }
        }
    });

    socket.ev.on('chats.set', async () => {
        const jid = "seu_numero_de_telefone"; // Substitua pelo número do usuário com quem você deseja interagir.
        await mostrarMenu(socket, jid);  // Envia o menu de boas-vindas logo após a primeira conexão
    });
}

// Função para mostrar o menu de opções com duração de 12 horas
async function mostrarMenu(socket, jid) {
    const menu = `
Todos os testes têm duração de **12 horas**. Selecione o tipo de teste que você gostaria de fazer:
10️⃣ Teste 12 horas Android
11️⃣ Teste 12 horas iPhone
12️⃣ Teste 12 horas TV Box
13️⃣ Teste 12 horas TV Android
14️⃣ Teste 12 horas Smart LG
15️⃣ Teste 12 horas Smart Samsung
16️⃣ Teste 12 horas Outra Opção
Digite o número da opção desejada.`;

    await socket.sendMessage(jid, { text: menu });
}

// Função para gerar credenciais aleatórias
function gerarCredenciaisAleatorias() {
    const usuario = `user${Math.random().toString(36).substring(2, 10)}`;
    const senha = Math.random().toString(36).substring(2, 10);
    return { usuario, senha };
}

// Função para criar o teste baseado na escolha do usuário
async function criarTeste(socket, jid, opcao) {
    if (testesCriados[opcao]) {
        await socket.sendMessage(jid, { text: `❌ O teste para a opção ${opcao} já foi realizado anteriormente. Escolha outra opção.` });
        return;
    }

    let apiUrl;
    let tipoTeste;

    // Define o tipo de teste e a URL da API com base na opção escolhida
    switch (opcao) {
        case '10':
            apiUrl = 'https://starplay.sigma.st/api/chatbot/QELoMd4Wgr/Yxl1jB1Mjm';
            tipoTeste = 'Android';
            break;
        case '11':
            apiUrl = 'https://starplay.sigma.st/api/chatbot/QELoMd4Wgr/Yxl1jB1Mjm';  // Defina a URL correta
            tipoTeste = 'iPhone';
            break;
        case '12':
            apiUrl = 'https://starplay.sigma.st/api/chatbot/QELoMd4Wgr/b8K1x6DvGN';
            tipoTeste = 'TV Box';
            break;
        case '13':
            apiUrl = 'https://starplay.sigma.st/api/chatbot/QELoMd4Wgr/aYB1wBWvme';
            tipoTeste = 'TV Android';
            break;
        case '14':
            apiUrl = 'https://starplay.sigma.st/api/chatbot/QELoMd4Wgr/QywDmMRDpR';
            tipoTeste = 'Smart LG';
            break;
        case '15':
            apiUrl = 'https://starplay.sigma.st/api/chatbot/QELoMd4Wgr/JOALy014wx';
            tipoTeste = 'Smart Samsung';
            break;
        case '16':
            apiUrl = 'https://starplay.sigma.st/api/chatbot/QELoMd4Wgr/someNewApiUrl';
            tipoTeste = 'Outra Opção';  // Defina a URL e tipo correto para esta opção
            break;
        default:
            await socket.sendMessage(jid, { text: '❌ Opção inválida. Tente novamente.' });
            return;
    }

    try {
        console.log(`[${moment().format()}] 📝 Iniciando criação de teste ${tipoTeste} para: ${jid}`);

        const { usuario, senha } = gerarCredenciaisAleatorias();

        const data = {
            name: usuario,
            email: `${usuario}@example.com`,
            password: senha,
            duration: '12 horas'  // Duração fixa de 12 horas
        };

        console.log(`[${moment().format()}] 🔗 Enviando requisição para a API: ${apiUrl}`);
        console.log(`[${moment().format()}] 📤 Dados enviados:`, data);

        const response = await axios.post(apiUrl, data);
        console.log(`[${moment().format()}] 📥 Resposta da API:`, response.data);

        // Verificação da resposta da API
        if (response.data.reply) {
            const mensagem = response.data.reply;
            await socket.sendMessage(jid, { text: mensagem });
            console.log(`[${moment().format()}] 📤 Teste ${tipoTeste} enviado para: ${jid}`);
        } else {
            await socket.sendMessage(jid, { text: `❌ Falha ao criar o teste ${tipoTeste}. Tente novamente mais tarde.` });
            console.log(`[${moment().format()}] ❌ Falha ao criar o teste ${tipoTeste}.`);
        }

        // Marcar que o teste foi criado para essa opção
        testesCriados[opcao] = true;

    } catch (error) {
        console.error(`[${moment().format()}] 🚨 Erro ao criar teste ${tipoTeste}:`, error);
        await socket.sendMessage(jid, { text: `❌ Ocorreu um erro ao tentar criar o teste ${tipoTeste}. Por favor, tente novamente mais tarde.` });
    }
}

// Iniciar o bot
startSock().catch((error) => {
    console.error(`[${moment().format()}] 🚨 Erro ao iniciar o bot:`, error);
});

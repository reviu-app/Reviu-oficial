const SUPABASE_URL = 'https://pzyirvvnlbfzxrsmoycq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6FOq54jJ_M9EBp2B-PufCg_FTDdBb6J';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Testar conexão
async function testarConexao() {
    console.log('Conectando ao Supabase...');
    
    const { data, error } = await supabase
        .from('sua_tabela')  // coloque o nome da sua tabela aqui
        .select('*');
    
    if (error) {
        console.error('Erro:', error);
    } else {
        console.log('✅ Conectado! Dados:', data);
    }
}

testarConexao();

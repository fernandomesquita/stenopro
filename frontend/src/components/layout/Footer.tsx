import { Github } from 'lucide-react';

const VERSION = '1.0.0';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-gray-900 text-gray-400 py-6 border-t border-gray-800'>
      <div className='max-w-7xl mx-auto px-6'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
          {/* Créditos */}
          <div className='text-center md:text-left'>
            <p className='text-sm'>
              Desenvolvido por{' '}
              <span className='text-white font-semibold'>Fernando Mesquita</span>
            </p>
            <p className='text-xs mt-1 text-gray-500'>
              © {currentYear} StenoPro. Todos os direitos reservados.
            </p>
          </div>

          {/* Versão e Links */}
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2 text-xs bg-gray-800 px-3 py-1.5 rounded-full'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
              <span>Versão {VERSION}</span>
            </div>

            <a
              href='https://github.com/fernandomesquita'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1 text-xs hover:text-white transition-colors'
            >
              <Github className='w-4 h-4' />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

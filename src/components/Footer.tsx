import { useEffect, useState } from 'react'
import { parseGitRepo } from "../utils/git"
import { FolderSync } from 'lucide-react'
import { cn } from '../utils/cn'

export function Footer({ text, repo, dist_page }: { text?: string, repo?: string, dist_page?: string }) {
  const [latest, setLatest] = useState<string | null>(null)

  const git = parseGitRepo(repo)
  const PKG_URL = `https://raw.githubusercontent.com/${git.user}/${git.repo}/main/package.json`

  useEffect(() => {
    fetch(PKG_URL)
      .then(r => (r.ok ? r.json() : null))
      .then(j => j?.version && setLatest(String(j.version)))
      .catch(() => { })
  }, [])

  const outdated = latest != null && latest !== __APP_VERSION__
  const laststDist = dist_page ? `${dist_page}/NodeGet-StatusShow.zip?version=v${latest}` : repo + '/releases'

  return (
    <footer className="relative z-10 w-full max-w-7xl mx-auto pt-2 pb-0">
      <div className="flex items-center justify-between gap-3 text-xs">
        <a 
          href="https://nezha.wiki/" 
          target="_blank" 
          rel="noreferrer" 
          className={cn(
            "inline-flex items-center px-4 py-2 rounded-full",
            "liquid-lens text-slate-700 dark:text-slate-300 font-medium",
            "hover:text-blue-600 dark:hover:text-blue-400 active:scale-95",
            "transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
          )}
        >
          {text || 'Powered by Nezha'}
        </a>

        {outdated && (
          <GlassFooterItem 
            href={laststDist}
            className="text-red-600 dark:text-red-400 bg-red-100/40 dark:bg-red-950/40 border-red-200/50 dark:border-red-800/50 hover:bg-red-200/50 dark:hover:bg-red-900/60 hover:border-red-300/60 shadow-[0_2px_8px_rgba(239,68,68,0.2)]"
            title="检测到新版本，请及时升级以获得最佳体验和安全性"
          >
            <FolderSync className='inline-block w-3.5 mr-1.5 opacity-80' />
            升级到 v{latest}
          </GlassFooterItem>
        )}
      </div>
    </footer>
  )
}

interface GlassFooterItemProps {
  href: string
  children: React.ReactNode
  className?: string
  title?: string
}

function GlassFooterItem({ href, children, className, title }: GlassFooterItemProps) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer" 
      title={title}
      className={cn(
        "inline-flex items-center px-3.5 py-1.5 rounded-full",
        "liquid-lens text-slate-700 dark:text-slate-300",
        "hover:bg-white/75 dark:hover:bg-white/15 hover:border-white/90 dark:hover:border-white/20 active:scale-95",
        "transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.05)]",
        className
      )}
    >
      {children}
    </a>
  )
}

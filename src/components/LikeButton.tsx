import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { showToast } from './Toast'

export default function LikeButton({ productId }: { productId: string }) {
  const { user, toggleLike } = useAuth()
  const navigate = useNavigate()
  const liked = !!user?.likes.includes(productId)

  return (
    <button
      className={`like-btn${liked ? ' liked' : ''}`}
      aria-label={liked ? 'הסרה מהמועדפים' : 'הוספה למועדפים'}
      aria-pressed={liked}
      onClick={(e) => {
        e.preventDefault()
        if (!user) {
          showToast('התחברו כדי לשמור מועדפים')
          navigate('/login')
          return
        }
        toggleLike(productId)
        showToast(liked ? 'הוסר מהמועדפים' : 'נשמר במועדפים ❤️')
      }}
    >
      {liked ? '❤️' : '🤍'}
    </button>
  )
}

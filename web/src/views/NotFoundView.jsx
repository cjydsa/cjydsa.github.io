import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFoundView() {
  const navigate = useNavigate()
  return (
    <Result
      status="404"
      title="404"
      subTitle="页面不存在或已被移动"
      extra={<Button type="primary" onClick={() => navigate('/')}>回到首页</Button>}
    />
  )
}

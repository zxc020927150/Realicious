import Link from 'next/link'

export default function ReturnLogin (){
  return (
    <Link href={'/user/login'}>返回登入</Link>
  )
}
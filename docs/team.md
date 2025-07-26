<script setup>
import { VPTeamMembers } from 'vitepress/theme'

const members = [
  {
    avatar: 'https://www.github.com/CJKmkp.png',
    name: 'CJKmkp',
    title: '社区版维护者',
    links: [
      { icon: 'github', link: 'https://github.com/CJKmkp' }
    ]
  },
  {
    avatar: 'https://www.github.com/douxiba.png',
    name: 'douxiba',
    title: '原作者',
    links: [
      { icon: 'github', link: 'https://github.com/douxiba' }
    ]
  },
]
</script>

### 团队

<ArticleMetadata />

<VPTeamMembers size="small" :members="members" />
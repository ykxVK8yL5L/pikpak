# pikpak
pikpak网页客户端 docker部署   及kodi插件(kodi版目前用的是直连)    
端口:8080

https://hub.docker.com/r/ykxvk8yl5l/pikpak

视频演示:https://youtu.be/rKTJ6HtXKec  


主要解决三个问题:   
1、ios或者说safari复制地址失败的问题    
2、自定义的菜单的链接类型无法打开  
3、新窗口打开目录，这样可以在新窗口打开子目录，再返回不需要再次请求。    

同时加入了复制视频链接时可选画质的功能  
服务器方面用go的gin框架
Docker部署 镜像很小

源码来自:https://github.com/mumuchenchen/pikpak  
跟原版比只修改了list.vue文件  所以就只上传它了

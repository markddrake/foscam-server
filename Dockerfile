FROM mdrake/vsftp-base

ENV TZ=Americas/Los_Angeles
RUN set -ex \
 && apk --no-cache --no-progress add bash tini \
 && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
 && echo $TZ > /etc/timezone 
    
copy vsftpd_user.conf /etc/default

RUN set -ex \
 && mkdir /home//camera-upload/ \
 && echo "foscam:$(openssl passwd -1 Camera!Upload)" >> /etc/vsftpd/virtual_users \
 && cp /etc/default/vsftpd_user.conf /etc/vsftpd/vsftpd_user_conf/foscam \
 && echo "foscam" >> /etc/vsftpd/vsftpd_user_conf/foscam \
 && mkdir /home/camera-upload/foscam \
 && chown -R virtual:virtual /home/camera-upload/

ENTRYPOINT ["/sbin/tini", "","/usr/sbin/vsftpd.sh"]

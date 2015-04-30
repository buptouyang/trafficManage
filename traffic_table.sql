


DROP TABLE IF EXISTS `TRAFFIC_INFO`;
CREATE TABLE `traffic_info` (
	t_id int NOT NULL AUTOINCREMENT PRIMARY KEY,
	t_name VARCHAR(256) not null,
	t_desc VARCHAR(256),
	t_time int NOT　NULL
) ENGINE=InnoDB DEFAULT charset=utf8;

DROP TABLE IF EXISTS `CAPTURE_TRAFFIC`;
	c_id int not null autoincrement
	FOREIGN KEY (`t_id`) REFERENCE TRAFFIC_INFO(`t_id`) ON CASCADE,
	port_id smallint not null,
	net_pro smallint not null,
	trans_pro smallint not null,
	tuple_num bigint,
	pkt_num bigint,
	traffic_size bigint,
	frag_num bigint,
	size_40_80 bigint,
	size_81_160 bigint,
	size_161_320 bigint,
	size_321_640 bigint,
	size_641_1280 bigint,
	size_1280_1500 bigint,
	size_1501 bigint,
	c_time int not NULL
)ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE `CAPTURE_TRAFFIC` ADD INDEX (`t_id`, `port_id`, `net_pro`, `trans_pro`);
ALTER TABLE `CAPTURE_TRAFFIC` ADD INDEX (`c_time`);

--
--prot_id(网卡端口号), 取值0、1、2等。
--net_pro(网络协议),取值4(IPv4)、6(IPv6)
--trans_pro(传输层协议)，取值6(TCP)、17(UDP)、99（其他）
--

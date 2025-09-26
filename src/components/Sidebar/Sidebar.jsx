import React, { useState } from "react";
import Button from "../common/Button";
import Icon from "../common/Icon";
import styles from "./Sidebar.module.css";

const Sidebar = ({
    conversations,
    activeConversation,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // 分组对话列表
    const groupConversations = () => {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const groups = {
            today: [],
            week: [],
            month: [],
            older: [],
        };

        conversations.forEach((conv) => {
            const convDate = new Date(conv.createdAt);

            if (convDate >= today) {
                groups.today.push(conv);
            } else if (convDate >= oneWeekAgo) {
                groups.week.push(conv);
            } else if (convDate >= oneMonthAgo) {
                groups.month.push(conv);
            } else {
                groups.older.push(conv);
            }
        });

        return groups;
    };

    const groupedConversations = groupConversations();

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div
            className={`${styles.sidebar} ${
                isCollapsed ? styles.collapsed : ""
            }`}>
            {/* 顶部栏 - 包含标题和折叠按钮 */}
            <div
                className={`${styles.header} ${
                    isCollapsed ? styles.collapsed : ""
                }`}>
                {!isCollapsed && (
                    <div className={styles.headerTitle}>科研成果评价系统</div>
                )}
                <Button
                    variant="ghost"
                    shape="circle"
                    className={styles.toggleButton}
                    onClick={toggleSidebar}>
                    <Icon
                        name={
                            isCollapsed
                                ? "MenuUnfoldOutlined"
                                : "MenuFoldOutlined"
                        }
                        size={16}
                    />
                </Button>
            </div>

            {/* 主内容区 - 折叠时隐藏 */}
            {!isCollapsed && (
                <>
                    <div className={styles.actions}>
                        <Button
                            variant="primary"
                            size="medium"
                            fullWidth
                            onClick={onNewConversation}>
                            <Icon name="PlusCircleOutlined" size={16} />{" "}
                            新建对话
                        </Button>

                        {/* <div className={styles.actionGroup}> */}
                        <Button variant="secondary" size="medium" fullWidth>
                            <Icon name="FolderAddOutlined" size={16} />{" "}
                            新建文件夹
                        </Button>
                        <Button variant="secondary" size="medium" fullWidth>
                            <Icon name="StarOutlined" size={16} /> 我的收藏
                        </Button>
                        {/* </div> */}
                    </div>

                    <div className={styles.conversationList}>
                        {/* 今天 */}
                        {groupedConversations.today.length > 0 && (
                            <div className={styles.groupSection}>
                                <div className={styles.groupTitle}>今天</div>
                                {groupedConversations.today.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conv={conv}
                                        isActive={
                                            activeConversation === conv.id
                                        }
                                        onSelect={onSelectConversation}
                                        onDelete={onDeleteConversation}
                                    />
                                ))}
                            </div>
                        )}

                        {/* 一周前 */}
                        {groupedConversations.week.length > 0 && (
                            <div className={styles.groupSection}>
                                <div className={styles.groupTitle}>一周前</div>
                                {groupedConversations.week.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conv={conv}
                                        isActive={
                                            activeConversation === conv.id
                                        }
                                        onSelect={onSelectConversation}
                                        onDelete={onDeleteConversation}
                                    />
                                ))}
                            </div>
                        )}

                        {/* 一个月前 */}
                        {groupedConversations.month.length > 0 && (
                            <div className={styles.groupSection}>
                                <div className={styles.groupTitle}>
                                    一个月前
                                </div>
                                {groupedConversations.month.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conv={conv}
                                        isActive={
                                            activeConversation === conv.id
                                        }
                                        onSelect={onSelectConversation}
                                        onDelete={onDeleteConversation}
                                    />
                                ))}
                            </div>
                        )}

                        {/* 更早 */}
                        {groupedConversations.older.length > 0 && (
                            <div className={styles.groupSection}>
                                <div className={styles.groupTitle}>更早</div>
                                {groupedConversations.older.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conv={conv}
                                        isActive={
                                            activeConversation === conv.id
                                        }
                                        onSelect={onSelectConversation}
                                        onDelete={onDeleteConversation}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* 折叠状态下的对话图标 */}
            {isCollapsed && (
                <div className={styles.collapsedConversations}>
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`${styles.collapsedItem} ${
                                activeConversation === conv.id
                                    ? styles.active
                                    : ""
                            }`}
                            onClick={() => onSelectConversation(conv.id)}
                            title={conv.title}>
                            <Icon name="MessageOutlined" size={18} />
                        </div>
                    ))}
                </div>
            )}

            {/* 底部用户信息 */}
            <div className={styles.footer}>
                {!isCollapsed ? (
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>
                            <Icon name="UserOutlined" size={20} />
                        </div>
                        <div className={styles.userName}>用户名</div>
                    </div>
                ) : (
                    <div className={styles.collapsedAvatar}>
                        <Icon name="UserOutlined" size={24} />
                    </div>
                )}
            </div>
        </div>
    );
};

// 提取对话项为单独组件
const ConversationItem = ({ conv, isActive, onSelect, onDelete }) => (
    <div
        className={`${styles.conversationItem} ${
            isActive ? styles.active : ""
        }`}
        onClick={() => onSelect(conv.id)}>
        <div className={styles.convIcon}>
            <Icon name="MessageOutlined" size={16} />
        </div>
        <div className={styles.convTitle}>{conv.title}</div>
        <button
            className={styles.deleteButton}
            onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
            }}>
            <Icon name="CloseOutlined" size={14} />
        </button>
    </div>
);

export default Sidebar;

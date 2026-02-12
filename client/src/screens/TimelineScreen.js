import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import supabase from './config/supabaseClient';
import { getHealthStatus, analyzeHealthLog } from '../utils/healthLogic';

export default function TimelineScreen({ session, onBack }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cat, setCat] = useState(null);

    useEffect(() => {
        if (session?.user) {
            fetchTimelineData();
        }
    }, [session]);

    const fetchTimelineData = async () => {
        try {
            setLoading(true);

            // 1. Get Cat Details (Safely handle multiple cats with limit(1))
            const { data: catData, error: catError } = await supabase
                .from('cats')
                .select('id, name, breed, gender')
                .eq('owner_id', session.user.id)
                .limit(1)
                .single();

            if (catError) {
                console.error("Error fetching cat:", catError);
                throw catError;
            }
            
            if (!catData) {
                setLoading(false);
                return;
            }
            
            setCat(catData);

            // 2. Get All Logs
            const { data: logsData, error: logsError } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('cat_id', catData.id)
                .order('log_date', { ascending: false });

            if (logsError) throw logsError;
            setLogs(logsData || []);

        } catch (error) {
            console.error("Error fetching timeline:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to format date groups
    const getGroupLabel = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Group logs by date
    const groupedLogs = logs.reduce((groups, log) => {
        const label = getGroupLabel(log.log_date);
        if (!groups[label]) groups[label] = [];
        groups[label].push(log);
        return groups;
    }, {});

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                     <Ionicons name="chevron-back" size={24} color="#00695C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Health Timeline</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Cat Info */}
            <View style={styles.catInfo}>
                {/* Avatar Placeholder */}
                 <View style={styles.avatarContainer}>
                     <Image source={require('../../assets/cioncat.jpg')} style={styles.avatar} /> 
                 </View>
                 <Text style={styles.catName}>{cat?.name || 'Luna'}</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                    <Text style={styles.activeTabText}>ALL</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={styles.tab}>
                    <Text style={styles.inactiveTabText}>log</Text>
                </TouchableOpacity>
            </View>

            {/* Timeline Content */}
            {loading ? (
                <ActivityIndicator size="large" color="#00695C" style={{ marginTop: 50 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.timelineContainer}>
                        {/* Vertical Line */}
                        <View style={styles.verticalLine} />

                        {Object.keys(groupedLogs).map((groupLabel, groupIndex) => (
                            <View key={groupIndex} style={styles.groupContainer}>
                                <Text style={styles.groupTitle}>{groupLabel}</Text>
                                
                                {groupedLogs[groupLabel].map((log, index) => {
                                    const analysis = analyzeHealthLog(log);
                                    return (
                                        <View key={index} style={styles.timelineItem}>
                                            {/* Icon Marker */}
                                            <View style={styles.markerContainer}>
                                                <View style={[styles.marker, { backgroundColor: '#2D4A47' }]}>
                                                    <MaterialCommunityIcons name="calendar-month" size={16} color="#fff" />
                                                </View>
                                            </View>

                                            {/* Content Card */}
                                            <View style={[styles.card, { backgroundColor: '#80CBC4' }]}>
                                                <View style={styles.cardHeader}>
                                                    <Text style={styles.cardTitle}>Daily log : {analysis.status.label.toLowerCase()}</Text>
                                                    <Text style={styles.cardTime}>
                                                        {/* Logs don't have time, so we mock or use created_at if available, else just date */}
                                                        {/* Supabase created_at is usually ISO timestamp */}
                                                        {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day'}
                                                    </Text>
                                                </View>
                                                <Text style={styles.cardDetail}>
                                                    Appetite {log.food_intake > 80 ? 'good' : 'fair'}, 
                                                    energy levels {log.behavior_enum ? log.behavior_enum : 'normal'}. 
                                                    {analysis.alerts.length > 0 ? `Issues: ${analysis.alerts.join(', ')}` : ' No issues reported.'}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}

                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00695C',
    },
    catInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 5,
        borderWidth: 2,
        borderColor: '#eee'
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    catName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00695C',
        textTransform: 'uppercase'
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    tab: {
        paddingVertical: 6,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#E0F2F1',
    },
    activeTab: {
        backgroundColor: '#2D4A47',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    inactiveTabText: {
        color: '#00695C',
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    timelineContainer: {
        position: 'relative',
        paddingLeft: 20, // Space for markers
    },
    verticalLine: {
        position: 'absolute',
        left: 20, // Align with marker center
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: '#B2DFDB',
    },
    groupContainer: {
        marginBottom: 20,
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#263238',
        marginBottom: 15,
        marginLeft: 25, 
    },
    timelineItem: {
        position: 'relative',
        marginBottom: 20,
        paddingLeft: 25, // Space between marker and card
    },
    markerContainer: {
        position: 'absolute',
        left: -20 + 2, // Adjust to center on line (line left=20, width=2 -> center=21. Marker center should be 21)
        // Let's rely on visual alignment. Line is at paddingLeft of container? No.
        // Container has pl: 20. Line is at left: 20.
        // Item is inside container. 
        // Let's assume line is at absolute left 20 of `timelineContainer`.
        // Item has paddingLeft 25.
        // Marker needs to be at left: -14 relative to Item content start?
        left: -33, // Tweaked for visual centering on line
        top: 15,
        zIndex: 1,
    },
    marker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff', 
    },
    card: {
        borderRadius: 12,
        padding: 15,
        minHeight: 80,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#004D40',
    },
    cardTime: {
        fontSize: 12,
        color: '#004D40',
        opacity: 0.8,
    },
    cardDetail: {
        fontSize: 13,
        color: '#004D40',
        opacity: 0.9,
    },
});
